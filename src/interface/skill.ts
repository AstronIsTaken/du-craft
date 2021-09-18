import {Recipe} from "./recipe";

export enum Operation {
  Input,
  Output,
  Time,
  Speed
}

export enum Subject {
  Item,
  Type,
  Tier,
  Industry
}

export class Skill {
  name: string;
  id: string;
  type: string;
  subtype: string;
  tier: bigint;
  subject: Subject;
  operation: Operation;
  amount: number;

  constructor(params: {
    name: string;
    parentId: string;
    type: string;
    subtype: string;
    tier: bigint;
    subject: Subject;
    operation: Operation;
    amount: number
  }) {
    this.name = assertDefined(params.name, "");
    this.id = [params.parentId, params.name].join(".");
    this.type = assertDefined(params.type, this.id);
    this.subtype = params.subtype;
    this.tier = params.tier;
    this.subject = assertDefined(params.subject, this.id);
    this.operation = assertDefined(params.operation, this.id);
    this.amount = assertDefined(params.amount, this.id);
  }


  isFor(recipe: Recipe): boolean {
    if (recipe.type == "Ore") {
      return false;
    }
    switch (this.subject) {
      case Subject.Tier:
        return recipe.tier == this.tier && recipe.type == this.type
          && (this.subtype == "" || recipe.subtype == this.subtype);
      case Subject.Item:
        return recipe.name == this.name;
      case Subject.Type:
        return recipe.type == this.type && (this.subtype == "" || recipe.subtype == this.subtype);
      case Subject.Industry:
        return recipe.industry == this.name;
    }
  }
}

export class SkillGroup {
  name: string;
  id: string;
  skills: Skill[];

  constructor(name: string, parentId: string, skills: Skill[]) {
    this.name = name;
    this.id = [parentId, name].join(".");
    this.skills = skills;
  }
}

export class SkillCategory {
  name: string;
  id: string;
  groups: SkillGroup[];
  constructor(name: string, groups: SkillGroup[]) {
    this.name = name;
    this.id = name;
    this.groups = groups;
  }
}

export class SkillTree {
  categories: SkillCategory[];
  constructor(categories: SkillCategory[]) {
    this.categories = categories;
  }
}

function assertDefined(o: any, m: string):any {
  if (o == undefined) {
    throw new Error("Undefined for " + m);
  }
  return o;
}
