import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { WidgetComponent } from './widget/widget.component';
import { TreeNodeComponent } from './tree-node/tree-node.component';
import { LeafDirective } from './tree-node/leaf.directive';

@NgModule({
  declarations: [
    AppComponent,
    WidgetComponent,
    TreeNodeComponent,
    LeafDirective
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
