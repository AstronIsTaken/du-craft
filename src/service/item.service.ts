import { Injectable } from '@angular/core';
import itemsAccordion from '../assets/data/itemsAccordion.json';
import {ItemsTree, Node} from "../interface/item";
import {Observable, of} from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class ItemService {

  private itemsTree?: ItemsTree;

  constructor() { }

  private getFullItemsTree(): ItemsTree {
    if (!this.itemsTree) {
      const nodes: Node[] = [];
      for (let i = 0; i < itemsAccordion.length; i++) {
        nodes.push(this.getNode(itemsAccordion[i]));
      }
      this.itemsTree = new ItemsTree(nodes);
    }
    return this.itemsTree;
  }

  getItemsTree(searchTerm?: string): Observable<ItemsTree> {
    console.log("Term: " + searchTerm);
    if (!searchTerm || !searchTerm.trim()) {
      return of(this.getFullItemsTree());
    }
    const resultTree: ItemsTree = new ItemsTree([]);
    this.getFullItemsTree().nodes.forEach(node => {
      const resultNode = this.searchByTerm(node, searchTerm.toUpperCase());
      if (resultNode) {
        resultTree.nodes.push(resultNode);
      }
    })
    console.log(resultTree);
    return of(resultTree);
  }

  private searchByTerm(node: Node, searchTerm: string): Node|undefined {
    if (node.name.toUpperCase().includes(searchTerm)) {
      return node;
    }
    const foundNodes: (string|Node)[] = [];
    node.nodes.forEach(node => {
        if (node instanceof Node) {
          const foundNode = this.searchByTerm(node, searchTerm);
          if (foundNode) {
            foundNodes.push(foundNode);
          }
        } else if (node.toUpperCase().includes(searchTerm, 0)) {
          foundNodes.push(node);
        }
      }
    )
    return (foundNodes.length > 0) ? new Node(node.name, foundNodes) : undefined;
  }

  private getNode(jsonNode: any): Node {
    const nodes: (Node|string)[] = [];
    for (let i = 0; i < jsonNode.data.length; i++) {
      const jsonChildNode = jsonNode.data[i];
      if (typeof jsonChildNode == "string") {
        nodes.push(jsonChildNode);
      } else {
        nodes.push(this.getNode(jsonChildNode));
      }
    }
    return new Node(jsonNode.name, nodes);
  }
}
