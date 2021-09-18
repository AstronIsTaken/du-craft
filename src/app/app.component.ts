import { Component, OnInit } from '@angular/core';
import {ItemService} from "../service/item.service";
import {ItemsTree, Node} from "../interface/item";
import {SkillService} from "../service/skill.service";
import {RecipeService} from "../service/recipe.service";
import {SkillCategory, SkillGroup, SkillTree} from "../interface/skill";
import {Observable, Subject} from "rxjs";
import {startWith, debounceTime, distinctUntilChanged, switchMap} from "rxjs/operators";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title: string = 'du-craft-angular';
  itemsTree$!: Observable<ItemsTree>;
  itemsTreeStatus: Map<string, boolean> = new Map<string, boolean>();
  private searchTerms = new Subject<string>();

  skillTree: SkillTree = new SkillTree([]);
  skillTreeStatus: Map<string, boolean> = new Map<string, boolean>();
  selectedItems: string[] = [];

  constructor(private itemService: ItemService,
              private skillService: SkillService,
              private recipeService: RecipeService) {

  }

  ngOnInit(): void {
    this.skillTree = this.skillService.getSkillTree();

    this.itemsTree$ = this.searchTerms.pipe(startWith("")).pipe(
      // wait 300ms after each keystroke before considering the term
      debounceTime(300),

      // ignore new term if same as previous term
      distinctUntilChanged(),

      // switch to new search observable each time the term changes
      switchMap((term: string) => this.itemService.getItemsTree(term)),
    );
  }

  getItemTreeNodes = (x:Node) => x.nodes

  selectTreeItem = (name:string) => {
    if (this.selectedItems.includes(name, 0)) {
      this.selectedItems = this.selectedItems.filter(i => i !== name);
    } else {
      this.selectedItems.push(name);
    }
  }

  getSkillTreeNodes = (x:SkillCategory|SkillGroup) => (x instanceof SkillCategory) ? x.groups : x.skills;

  searchItem(term: string): void {
    this.searchTerms.next(term);
  }
}
