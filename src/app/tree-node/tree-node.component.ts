import {Component, ContentChild, Input, OnInit, TemplateRef} from '@angular/core';
import {LeafDirective} from "./leaf.directive";

@Component({
  selector: 'app-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.css']
})
export class TreeNodeComponent implements OnInit {

  @Input() node: any;
  @Input() nodeStatuses: Map<string, boolean> = new Map<string, boolean>();

  // @ts-ignore
  @Input() template: TemplateRef<any>

  // @ts-ignore
  @Input() getNodes: Function;

  // @ts-ignore
  @ContentChild( LeafDirective, { read: TemplateRef }) leafTemplate;

  constructor() { }

  ngOnInit(): void {
  }
}
