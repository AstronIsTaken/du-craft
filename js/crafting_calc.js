// class for defining and item and its recipe
function itemRecipe(name, data) {
    this.name = name;
    this.tier = data.tier;
    this.type = data.type;
    this.subtype = data.subtype;
    this.mass = data.mass;
    this.volume = data.volume;
    this.outputQuantity = data.outputQuantity;
    this.time = data.time;
    this.byproducts = data.byproducts;
    this.industry = data.industry;
    this.input = data.input
    this.lang = {"english": this.name}

    // skills affect these stats
    this.actualOQ = JSON.parse(JSON.stringify(this.outputQuantity));
    this.actualInput = JSON.parse(JSON.stringify(this.input));
    this.actualTime = JSON.parse(JSON.stringify(this.time));
    this.actualB = JSON.parse(JSON.stringify(this.byproducts));

    if (this.input == null) {
        this.input = {};
    }

    this.getIngredients = function () {
        var out = [];
        Object.keys(this.input).forEach(function (name, i, a) {
            out.push({name: name, quantity: this.actualInput[name]});
        }, this);
        return out;
    };

    this.getByproducts = function () {
        var out = [];
        Object.keys(this.byproducts).forEach(function (name, i, a) {
            out.push({name: name, quantity: this.actualB[name]});
        }, this);
        return out;
    };
}

function isSkillApplicable(skill, recipe) {
    switch (skill.subject) {
        case "Tier":
            return recipe.tier == skill.tier && recipe.type == skill.type && recipe.subtype == skill.subtype;
        case "Item":
            return recipe.name == skill.name;
        case "Type":
            return recipe.type == skill.type && recipe.subtype == skill.subtype;
        case "Industry":
            return recipe.industry == skill.name;
    }
}

// holds recipe database and performs crafting calculations
function recipeCalc(data) {

    //parse db from JSON
    this.types = [];

    this.lang = {"english": {}};
    this.langr = {"english": {}}

    this.trans = function (lang, name) {
        if (this.lang[lang][name]) {
            return this.lang[lang][name];
        } else {
            return name
        }
    }
    this.transr = function (lang, name) {
        if (this.langr[lang][name]) {
            return this.langr[lang][name];
        } else {
            return name
        }
    }

    this.parseDb = function (db) {
        var lines;
        var cols;
        var headers;
        this.db = {};
        var unknownItems = new Set();

        var db = JSON.parse(db);
        Object.keys(db).forEach(function (name, i) {
            var fnd = false;
            for (var j = 0; j < this.types.length; j++) {
                if (this.types[j] == db[name].type) {
                    fnd = true;
                    break;
                }
            }
            if (!fnd) {
                this.types.push(db[name].type);
            }
            var item = new itemRecipe(name, db[name]);
            item.getIngredients().forEach(function (ingredient) {
                if (!this.db[ingredient.name]) {
                    unknownItems.add(ingredient.name);
                }
            }, this);
            this.db[name] = item;
            unknownItems.delete(name);
            this.lang.english[name] = name;
            this.langr.english[name] = name;
        }, this);

        if (unknownItems.size > 0) {
            console.error("unknownItems: " + [...unknownItems]);
        }
    };

    this.addTrans = function (trans) {
        Object.keys(trans).forEach(function (lang, i) {
            this.lang[lang] = trans[lang];
            this.langr[lang] = {}
            Object.keys(trans[lang]).forEach(function (english, j) {
                this.langr[lang][trans[lang][english]] = english;
            }, this);
        }, this);
    };


    this.data = data;
    this.parseDb(data);
    this.debug = [];

    this.reduceItems = function (list) {
        var newList = [];
        for (var i = 0; i < list.length; i++) {
            if (typeof list[i].bpquantity === "undefined") {
                list[i].bpquantity = 0;
            }
            if (typeof list[i].quantity === "undefined") {
                list[i].quantity = 0;
            }
            var fnd = false;
            for (var j = 0; j < newList.length; j++) {
                if (list[i].name === newList[j].name) {
                    newList[j].quantity += list[i].quantity;
                    newList[j].bpquantity += list[i].bpquantity;

                    Object.keys(list[i]).forEach(function (item, index) {
                        if (item == "quantity" || item == "bpquantity") {
                            return;
                        }
                        newList[j][item] = list[i][item];
                    });

                    fnd = true;
                    break;
                }
            }
            if (!fnd && (list[i].quantity + list[i].bpquantity) > 0) {
                var obj = {};
                Object.keys(list[i]).forEach(function (item, index) {
                    obj[item] = list[i][item];
                });
                newList[newList.length] = obj;
            }
        }
        var t = this;
        newList.sort(function (l, r) {
            var typeL = t.db[l.name].type;
            var typeR = t.db[r.name].type;
            return t.types.indexOf(typeL) > t.types.indexOf(typeR);
        });
        return newList;
    };

    this.modifyItemStat = function (itemName, skill, skillValue) {
        const amount = skill.amount * skillValue;
        switch (skill.class) {
            case "Time":
                this.db[itemName].actualTime = this.db[itemName].actualTime * (1 - amount);
                break;
            case "Speed":
                const speed = this.db[itemName].outputQuantity / this.db[itemName].actualTime * (1 + amount)
                this.db[itemName].actualTime = this.db[itemName].outputQuantity / speed;
                break;
            case "Output":
                this.db[itemName].actualOQ = this.db[itemName].actualOQ * (1 + amount);
                Object.keys(this.db[itemName].actualB).forEach(function (k, i) {
                    this.db[itemName].actualB[k] = this.db[itemName].byproducts[k] * (1 + amount);
                }, this);
                break;
            case "Input":
                Object.keys(this.db[itemName].actualInput).forEach(function (k, i) {
                    this.db[itemName].actualInput[k] = this.db[itemName].actualInput[k] * (1 - amount);
                }, this);
        }
    }

    this.resetItemStats = function () {
        Object.keys(this.db).forEach(function (name, i) {
            this.db[name].actualOQ = JSON.parse(JSON.stringify(this.db[name].outputQuantity));
            this.db[name].actualInput = JSON.parse(JSON.stringify(this.db[name].input));
            this.db[name].actualTime = JSON.parse(JSON.stringify(this.db[name].time));
            this.db[name].actualB = JSON.parse(JSON.stringify(this.db[name].byproducts));
        }, this);
    }

    this.updateSkills = function (skills, skillValues) {
        this.resetItemStats();

        skills.forEach(skill => {
            Object.keys(this.db).forEach(function (name) {
                const item = this.db[name];
                if (isSkillApplicable(skill, item)) {
                    this.modifyItemStat(name, skill, skillValues.getValue(skill.id));
                }
            }, this);
        });
    }

    //crafting simulation calculation
    // returns list of required crafting queue for a given input of crafted items
    this.simulate = function (input, inventory) {

        var itemSequence = [];

        for (var jj = 0; jj < input.length; jj++) {
            var iqPair = input[jj];

            this.debug.push("number of " + iqPair.name + " required " + iqPair.quantity);
            this.debug.push("checking inventory " + JSON.stringify(inventory[iqPair.name]));
            if (iqPair.quantity <= (inventory[iqPair.name].quantity + inventory[iqPair.name].bpquantity)) {

                this.debug.push("inventory has enough of input, moving on to next input");
                continue;
            }

            var ingredients = this.db[iqPair.name].getIngredients();
            var byproducts = this.db[iqPair.name].getByproducts();
            var oq = this.db[iqPair.name].actualOQ;

            this.debug.push("----checking ingredients of input");
            this.debug.push(JSON.stringify(ingredients));
            this.debug.push("----checking inventory for ingredients");
            if (ingredients.length != 0) {
                this.debug.push(iqPair.name + ": " + inventory[iqPair.name].quantity + " of " + iqPair.quantity);
                while (inventory[iqPair.name].quantity + inventory[iqPair.name].bpquantity < iqPair.quantity) {
                    this.debug.push("crafting ingredients for " + iqPair.name);
                    ingredients.forEach(function (ingPair, i) {
                        this.debug.push("");
                        var subSeq = this.simulate([ingPair], inventory);

                        if (inventory[ingPair.name].bpquantity > ingPair.quantity) {
                            inventory[ingPair.name].bpquantity -= ingPair.quantity;
                        } else if (inventory[ingPair.name].bpquantity > 0) {
                            var diff = ingPair.quantity - inventory[ingPair.name].bpquantity;
                            inventory[ingPair.name].bpquantity = 0;
                            inventory[ingPair.name].quantity -= diff;
                        } else {
                            inventory[ingPair.name].quantity -= ingPair.quantity
                        }
                        itemSequence = itemSequence.concat(subSeq);
                    }, this);
                    inventory[iqPair.name].quantity += oq;

                    this.debug.push(iqPair.name + " now has: " + inventory[iqPair.name].quantity + " of " + iqPair.quantity);

                    itemSequence = itemSequence.concat([{
                        name: iqPair.name,
                        quantity: oq,
                        effectivenessQ: 0,
                        skillQ: 0
                    }]);

                    byproducts.forEach(function (bPair, i) {
                        inventory[bPair.name].bpquantity += bPair.quantity;
                        itemSequence = itemSequence.concat([{name: bPair.name, bpquantity: bPair.quantity}]);
                    }, this);
                }
            } else {
                this.debug.push("this is a base recipe, inserting desired amount to inventory");
                itemSequence = itemSequence.concat([iqPair]);

                inventory[iqPair.name].quantity += iqPair.quantity;
                this.debug.push("have " + inventory[iqPair.name].quantity + " of " + iqPair.quantity);

                byproducts.forEach(function (bPair, i) {
                    inventory[bPair.name].bpquantity += iqPair.quantity * bPair.quantity;
                    itemSequence = itemSequence.concat([{
                        name: bPair.name,
                        bpquantity: bPair.quantity * iqPair.quantity
                    }]);
                }, this);
            }
        }

        return itemSequence;
    };

    // wrapper for the simulate func
    this.calcList = function (input, inv) {
        var inputRed = this.reduceItems(input);
        var invRed = this.reduceItems(inv);

        for (var i = inputRed.length - 1; i >= 0; i--) {
            if (this.db[inputRed[i].name] === undefined) {
                inputRed.splice(i, 1);
                continue;
            }
        }
        for (var i = invRed.length - 1; i >= 0; i--) {
            if (this.db[invRed[i].name] === undefined) {
                invRed.splice(i, 1);
                continue;
            }
        }

        var sortFunc = function (l, r) {
            return (l.typeid + l.tier / 10) - (r.typeid + r.tier / 10);
        }

        inputRed.forEach(function (k, i) {
            k.type = this.db[k.name].type;
            k.typeid = this.types.indexOf(this.db[k.name].type);
            k.tier = this.db[k.name].tier;
        }, this);

        inputRed.sort(sortFunc);
        inputRed.reverse();

        var inventory = {};
        Object.keys(this.db).forEach(function (k, i) {
            inventory[k] = {name: k, quantity: 0, bpquantity: 0};
        });
        invRed.forEach(function (e, i) {
            inventory[e.name].quantity = e.quantity;
        }, this);

        this.debug = [];
        var craftList = this.simulate(inputRed, inventory);
        var compressedList = this.reduceItems(JSON.parse(JSON.stringify(craftList)));


        function populate(k, i) {
            k.time = k.quantity / this.db[k.name].outputQuantity * this.db[k.name].actualTime;
            k.tier = this.db[k.name].tier;
            k.type = this.db[k.name].type;
            k.typeid = this.types.indexOf(k.type);
            k.industry = this.db[k.name].industry;
        }

        compressedList.forEach(populate, this);
        compressedList.sort(sortFunc);

        return {normal: compressedList, expanded: craftList, inventory: inventory}
    };
}