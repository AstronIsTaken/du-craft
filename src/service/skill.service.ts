import {Injectable} from '@angular/core';
import skillsAccordion from '../assets/data/skillsAccordion.json';
import {Operation, Skill, SkillCategory, SkillGroup, SkillTree, Subject} from "../interface/skill";

@Injectable({
  providedIn: 'root'
})
export class SkillService {

  constructor() {}

  getSkillTree(): SkillTree {
    const skillTree: SkillTree = new SkillTree([]);
    for (const categoryJson of skillsAccordion) {
      const category: SkillCategory = new SkillCategory(categoryJson.name, []);
      for (const groupJson of categoryJson.data) {
        const group: SkillGroup = new SkillGroup(groupJson.name, category.id, []);
        for (const skillJson of groupJson.skills) {
          group.skills.push(new Skill({
            name: skillJson.name,
            parentId: group.id,
            type: oneOf(skillJson, groupJson, "type"),
            subtype: oneOf(skillJson, {}, "subtype"),
            tier: oneOf(skillJson, groupJson, "tier"),
            subject: (<any>Subject)[oneOf<string>(skillJson, groupJson, "subject")],
            operation: (<any>Operation)[oneOf<string>(skillJson, groupJson, "operation")],
            amount: oneOf(skillJson, groupJson, "amount")
          }));
        }
        category.groups.push(group);
      }
      skillTree.categories.push(category);
    }
    return skillTree;
  }
}

function oneOf<T>(obj1: any, obj2: any, property: string): T {
  return obj1.hasOwnProperty(property) ? obj1[property] : obj2[property];
}
