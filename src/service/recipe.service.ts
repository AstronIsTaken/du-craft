import { Injectable } from '@angular/core';
import recipesAccordion from '../assets/data/recipes.json';
import {Recipe} from "../interface/recipe";

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  constructor() { }

  getRecipes(): Map<string, Recipe> {
    const recipes: Map<string, Recipe> = new Map<string, Recipe>();
    for (const name of Object.keys(recipesAccordion)) {
      const recipeJson = recipesAccordion[name];
      const recipe = new Recipe({
        name: name,
        tier: recipeJson.tier,
        type: recipeJson.type,
        subtype: (recipeJson.hasOwnProperty("subtype") ? recipeJson.subtype : ""),
        volume: recipeJson.volume,
        time: recipeJson.time,
        nanopack: recipeJson.hasOwnProperty("nanopack") ? recipeJson.nanopack : false,
        industry: recipeJson.industry,
        input: recipeJson.input,
        byproducts: recipeJson.byproducts,
        outputQuantity: recipeJson.outputQuantity
      });
      recipes.set(name, recipe);
    }
    return recipes;
  }
}
