import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-simple-list-paste',
  templateUrl: './simple-list-paste.component.html',
  styleUrls: ['./simple-list-paste.component.css'],
})
export class SimpleListPasteComponent implements OnInit {
  @ViewChild('listEditor') listEditor: ElementRef<HTMLUListElement>;
  @ViewChild('contextMenu') contextMenu: ElementRef<HTMLSpanElement>;
  elementRenderDelay = 10;
  list = [{ value: '' }];
  ctrlDown = false;
  contextVisible = false;
  contextStyle = {
    left: '',
    top: '',
  };
  cached = {
    input: {
      value: '',
      index: 0,
    },
  };
  selectedTextBefore = '';

  contextMenuList = [];
  @Input() contextMenuListOption = {
    list: [],
    isOnlyFromOption: false,
  };
  currentCursor = 0;
  isFocused: boolean = false;

  constructor(public clipboard: Clipboard) {}

  get selectionText() {
    return getSelection().toString();
  }
  get isEmptyValue() {
    if (this.isFocused) return false;
    return this.list.length === 1 && this.list[0].value === '';
  }

  ngOnInit() {
    this.setContextMenu();
    // this.list = [{ value: 'option 1' }, { value: 'option 2' }];
  }

  isOnContext(event) {
    console.log(event.target.className);
    return event.target.className == 'context-menu-item';
  }

  contextSelect(item) {
    if (item.handler) item.handler();

    this.hideContextMenu();
  }

  focusToEnd() {
    if (this.listEditor) {
      const input = this.listEditor.nativeElement.lastElementChild
        .lastElementChild as HTMLInputElement;
      input.focus();
    }
  }

  getNextList(curInput: HTMLInputElement): HTMLLIElement {
    return curInput.parentElement.nextElementSibling as HTMLLIElement;
  }

  getPrevList(curInput: HTMLInputElement): HTMLLIElement {
    return curInput.parentElement.previousElementSibling as HTMLLIElement;
  }

  handlePrevWord(target: HTMLInputElement): string {
    const { value, selectionStart } = target;
    const result = value.substring(selectionStart, value.length);
    target.value = value.substring(0, selectionStart);
    return result;
  }

  handleMouseUp(event) {
    setTimeout(() => (this.isFocused = true), this.elementRenderDelay);

    const tagName = event.target.tagName;
    const { clientX, clientY } = event;
    if (
      tagName !== 'INPUT' &&
      !this.isOnContext(event) &&
      !(this.selectionText.length > 0)
    ) {
      setTimeout(() => this.focusToEnd(), this.elementRenderDelay);
    }
    if (event.button === 0) {
      if (!this.isOnContext(event)) this.hideContextMenu();
    } else if (event.button === 2) {
      this.selectedTextBefore = getSelection().toString();
      this.showContextMenu(clientX, clientY);
    }
  }

  handleKeyDown(event, index) {
    if (event.key === 'Control') this.ctrlDown = true;
    this.handleBackspace(event, index);
    this.handleNavigationKey(event);
  }

  handleKeyInput(event, index) {
    if (this.handlePaste(event)) return;
    this.handleNewInput(event, index);
  }

  handleFocus(event, idx) {
    this.currentCursor = idx;

    this.cached.input.index = idx;
    this.cached.input.value = event.target.value;
    console.log(this.cached);
  }

  handleClick(idx) {
    this.removeAllEmptyValue(idx);
  }

  handleNavigationKey(event) {
    if (event.key === 'ArrowUp') {
      const prev = this.getPrevList(event.target);
      if (prev) {
        const input = prev.lastElementChild as HTMLInputElement;
        input.setSelectionRange(input.value.length, input.value.length);
        input.focus();
      }
    }

    if (event.key === 'ArrowDown') {
      const next = this.getNextList(event.target);
      if (next) {
        const input = next.lastElementChild as HTMLInputElement;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }

  handleBackspace(event, index) {
    if (event.key === 'Backspace') {
      const tgt = event.target;
      if (tgt.value.length === 0 && this.list.length > 1) {
        const prev = this.getPrevList(tgt);
        const next = this.getNextList(tgt);

        if (prev) {
          (prev.lastElementChild as HTMLInputElement).focus();
          (prev.lastElementChild as HTMLInputElement).value += ' ';
        } else if (next) {
          (next.lastElementChild as HTMLInputElement).focus();
          (next.lastElementChild as HTMLInputElement).value += ' ';
        }

        this.list.splice(index, 1);
      }
    }
  }

  handlePaste(event) {
    if (event.key === 'Control') this.ctrlDown = false;
    if (this.ctrlDown && event.key === 'v') {
      this.handlePasteCTRL(event.target);
      return true;
    }
    return false;
  }

  handlePasteContextMenu() {
    navigator.clipboard.readText().then((value) => {
      this.pasteInside(value);
    });
  }

  handlePasteCTRL(target: HTMLInputElement) {
    navigator.clipboard.readText().then((value) => {
      if (value.search(/\n/g) > 0) {
        target.value = this.cached.input.value;
        this.pasteInside(value);
        const list = Object.assign([], this.list) as { value: string }[];
        target.value += list[this.currentCursor + 1].value;
        this.list.splice(this.currentCursor + 1, 1);
      }
    });
  }

  pasteInside(value) {
    const newList = [];
    for (let text of value.split('\n')) {
      newList.push({ value: text.replace(/\t/g, ' ') });
    }
    this.list.splice(this.currentCursor + 1, 0, ...newList);
  }

  handleNewInput(event, index) {
    if (event.key === 'Enter' && this.listEditor) {
      this.list.splice(index + 1, 0, {
        value: this.handlePrevWord(event.target),
      });
      const tgt = event.target;
      setTimeout(() => {
        const nextInput = this.getNextList(tgt)
          .lastElementChild as HTMLInputElement;
        nextInput.focus();
      }, this.elementRenderDelay);
    }
  }

  hideContextMenu() {
    this.contextVisible = false;
  }

  handleCopy() {
    this.clipboard.copy(this.selectedTextBefore);
  }

  handleCopyAll() {
    this.removeAllEmptyValue(-1);
    this.clipboard.copy(this.list.map((e) => e.value).join('\n'));
  }

  handleReplaceAll() {
    navigator.clipboard.readText().then((value) => {
      const newList = [];
      for (let text of value.split('\n')) {
        newList.push({ value: text.replace(/\t/g, ' ') });
      }
      this.list = newList;
    });
  }

  @HostListener('document:mouseup', ['$event'])
  outSideClick(event) {
    this.isFocused = false;

    const mainApp = (event.path as HTMLElement[]).find(
      (el) => el.localName == 'app-simple-list-paste'
    );
    if (mainApp == undefined) this.hideContextMenu();
  }

  preventDefault(event) {
    event.preventDefault();
  }

  removeAllEmptyValue(idx) {
    let values = [];
    this.list.forEach((item, itemIdx) => {
      if (itemIdx !== idx) {
        if (item.value.replace(/ /g, '').length !== 0) values.push(item);
      } else values.push(item);
    });
    this.list = values;
  }

  showContextMenu(clientX, clientY) {
    this.contextVisible = true;
    this.contextStyle.left = clientX + 'px';
    this.contextStyle.top = clientY + 'px';
  }

  setContextMenu() {
    this.contextMenuList = [
      { label: 'Copy', handler: () => this.handleCopy() },
      { label: 'Copy All', handler: () => this.handleCopyAll() },
      { label: 'Paste', handler: () => this.handlePasteContextMenu() },
      { label: 'Paste Replace All', handler: () => this.handleReplaceAll() },
    ];
    if (this.contextMenuListOption.isOnlyFromOption) this.contextMenuList = [];
    this.contextMenuList.push(...this.contextMenuListOption.list);
  }
}
