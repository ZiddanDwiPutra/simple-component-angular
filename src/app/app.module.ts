import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { SimpleListPasteComponent } from './part/simple-list-paste/simple-list-paste.component';

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [AppComponent, HelloComponent, SimpleListPasteComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
