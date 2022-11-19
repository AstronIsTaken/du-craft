// classes

class Skill {
    name;
    id;
    type;
    subtype;
    tier;
    subject;
    class;
    amount;

    constructor(categoryName, groupName, skillName) {
        this.name = skillName;
        this.id = [categoryName, groupName, skillName].join(".");
    }
}

class SkillGroup {
    name;
    id;
    skills = [];

    constructor(categoryName, groupName) {
        this.name = groupName;
        this.id = [categoryName, groupName].join(".");
    }
}

class SkillCategory {
    name;
    id;
    groups = [];

    constructor(name) {
        this.name = name;
        this.id = name;
    }
}

showOnlyApplicableSkills = false;

class SkillValues {
    onlyApplicableSkills = false;
    values = {};

    getValue(id) {
        return parseInt(this.values.hasOwnProperty(id) ? this.values[id] : 0);
    }

    setValue(id, value) {
        const oldValue = this.getValue(id);
        let newValue = parseInt(value);
        if (isNaN(newValue) || newValue < 0) {
            newValue = 0;
        } else if (newValue > 5) {
            newValue = 5;
        }
        if (oldValue !== newValue) {
            this.values[id] = newValue;
            return true;
        }
        return false;
    }
}

// helper functions
function getAllSkills() {
    const skills = [];
    skillTree.forEach(c => {
        c.groups.forEach(g => {
            skills.push(...g.skills);
        })
    })
    return skills;
}


function loadJSON(path, callback) {
    let xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', path, false); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
        if (xobj.readyState === 4 && xobj.status === 200) {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}

function copyStringToClipboard(str) {
    // Create new element
    var el = document.createElement('textarea');
    // Set value (string to be copied)
    el.value = str;
    // Set non-editable to avoid focus and move outside of view
    el.setAttribute('readonly', '');
    el.style = {position: 'absolute', left: '-9999px'};
    document.body.appendChild(el);
    // Select text inside element
    el.select();
    // Copy text to clipboard
    document.execCommand('copy');
    // Remove temporary element
    document.body.removeChild(el);
}

var itemsAccordion, prices, recipes, german, schematicsPrices;

const version = "1";
const lastUpdateTime = "2022-01-25";
document.getElementById("lastUpdateTime").innerHTML = lastUpdateTime;
console.log("Crafting Calculator Updated On: " + lastUpdateTime)
console.log("Crafting Calculator Profile Version: " + version)

let language = "english";

let skillTree;
let skillValues = new SkillValues();

loadJSON("../data/itemsAccordion.json", function (json) {
    itemsAccordion = JSON.parse(json);
})
loadJSON("../data/recipes.json", function (json) {
    recipes = JSON.parse(json);
})
loadJSON("../data/skillsAccordion.json", function (json) {
    skillTree = parseSkillFile(JSON.parse(json));
})
loadJSON("../data/orePrices.json", function (json) {
    prices = JSON.parse(json);
})
loadJSON("../data/schematicsPrices.json", function (json) {
    schematicsPrices = JSON.parse(json);
})

loadJSON("../data/craft_trans_german.json", function (json) {
    // german = json;
    german = JSON.stringify({});
})

function formatNum(num, fractionDigits) {
    if (typeof num != "number") {
        num = parseFloat(num);
    }
    const formatter = fD => new Intl.NumberFormat(navigator.language, {
        minimumFractionDigits: fD,
        maximumFractionDigits: fD,
    });
    return formatter(fractionDigits).format(num);
}

function formatTime(time) {
    if (typeof time != "number") {
        time = parseFloat(time);
    }

    time = parseInt(time, 10);
    let days = Math.floor(time / 86400);
    let hours = Math.floor((time % 86400) / 3600);
    let minutes = Math.floor((time % 3600) / 60);
    let seconds = time % 60;

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return (days > 0 ? days + ":" : "") + hours + ':' + minutes + ':' + seconds;
}

//-----------------------------------------------------------------------------------
// crafting calculator variables and calculation
var inv = [];
var craft = [];
var itemLists = [];

function getOneOf(obj1, obj2, property) {
    return obj1.hasOwnProperty(property) ? obj1[property] : obj2[property];
}

function parseSkillFile(skillFileJson) {
    const skillTree = [];
    skillFileJson.forEach(categoryJson => {
        const category = new SkillCategory(categoryJson.name);
        categoryJson.data.forEach(groupJson => {
            const group = new SkillGroup(categoryJson.name, groupJson.name);
            groupJson.skills.forEach(skillJson => {
                const skill = new Skill(category.name, group.name, skillJson.name);
                skill.type = getOneOf(skillJson, groupJson, "type");
                skill.subtype = getOneOf(skillJson, {}, "subtype");
                skill.tier = getOneOf(skillJson, groupJson, "tier");
                skill.subject = getOneOf(skillJson, groupJson, "subject");
                skill.class = getOneOf(skillJson, groupJson, "class");
                skill.amount = getOneOf(skillJson, groupJson, "amount");
                group.skills.push(skill);
                validateSkill(skill);
            });
            category.groups.push(group);
        });
        skillTree.push(category);
    });
    return skillTree;
}

function validateSkill(skill) {
    console.assert(skill.name, JSON.stringify(skill));
    console.assert(skill.id, JSON.stringify(skill));
    console.assert(skill.class, JSON.stringify(skill));
    console.assert(skill.amount, JSON.stringify(skill));
    console.assert(skill.subject, JSON.stringify(skill));
    if (skill.subject === "Industry") {
        console.assert(!skill.type, JSON.stringify(skill));
        console.assert(!skill.tier, JSON.stringify(skill));
    } else {
        console.assert(skill.type, JSON.stringify(skill));
        console.assert(skill.tier, JSON.stringify(skill));
    }
}

var cc = new recipeCalc(recipes);
cc.addTrans({"german": JSON.parse(german)});

var invListCols = invList.children.length;
var craftListCols = cftList.children.length;
var oreListCols = oreList.children.length;
var queueListCols = queueList.children.length;
var queueListDetailedCols = queueListDetailed.children.length;

//run crafting calculations and update output lists oreList and queueList
function calculate() {

    while (oreList.children.length > oreListCols) {
        oreList.removeChild(oreList.children[oreListCols])
    }
    while (queueList.children.length > queueListCols) {
        queueList.removeChild(queueList.children[queueListCols])
    }
    while (queueListDetailed.children.length > queueListDetailedCols) {
        queueListDetailed.removeChild(queueListDetailed.children[queueListDetailedCols])
    }
    if (craft.length === 0) {
        totalTime.innerHTML = formatTime(0);
        trySaveState();
        return;
    }

    itemLists = cc.calcList(craft, inv);
    var list = itemLists.normal;

    var totOre = 0;
    var totTime = 0;
    var orePrice = 0;

    var striped = false;

    for (var i = 0; i < list.length; i++) {
        var typeIndex = cc.types.indexOf(cc.db[list[i].name].type);
        if (i > 0 && typeIndex !== 0) {
            var typeIndexLast = cc.types.indexOf(cc.db[list[i - 1].name].type);
            if (typeIndex !== typeIndexLast) {
                var line1 = [];

                var gapdet1 = document.createElement("div");
                gapdet1.innerHTML = cc.db[list[i].name].type;
                line1.push(gapdet1);

                var gapdet2 = document.createElement("div");
                line1.push(gapdet2);

                var gapdet3 = document.createElement("div");
                line1.push(gapdet3);

                var gapdet4 = document.createElement("div");
                line1.push(gapdet4);

                var gapdet5 = document.createElement("div");
                line1.push(gapdet5);

                var gapdet6 = document.createElement("div");
                line1.push(gapdet6);

                line1.forEach(function (it, k) {
                    it.style.backgroundColor = "#777777";
                    queueListDetailed.appendChild(it);
                });

                line2 = [];
                var gap4 = document.createElement("div");
                gap4.innerHTML = cc.db[list[i].name].type;
                gap4.style.padding = "0 0 0 5px";
                line2.push(gap4);

                var gap5 = document.createElement("div");
                line2.push(gap5);

                var gap6 = document.createElement("div");
                line2.push(gap6);

                var gap7 = document.createElement("div");
                line2.push(gap7);

                line2.forEach(function (it, k) {
                    it.style.backgroundColor = "#777777";
                    it.style["border-radius"] = "3px";
                    queueList.appendChild(it);
                });
            }
        }

        const quantityFractionDigits = ["Ore", "Pure", "Product", "Catalyst"].includes(list[i].type) ? 2 : 0;
        if (list[i].type === "Ore") {
            var item = document.createElement("div");
            item.classList.add("ore-item");
            item.innerHTML = cc.trans(language, list[i].name);
            item.style.padding = "0 0 0 5px";
            item.style["border-radius"] = "3px";

            var qty = document.createElement("div");
            qty.classList.add("ore-quantity");
            qty.innerHTML = formatNum(list[i].quantity, quantityFractionDigits);
            totOre += list[i].quantity;

            var price = document.createElement("div");
            price.classList.add("ore-quantity");
            price.innerHTML = formatNum(list[i].quantity * prices[list[i].name], 0);
            orePrice += list[i].quantity * prices[list[i].name];

            var check = document.createElement("button");
            check.classList.add("ore-done");
            check.onclick = finishOreItem;
            check.innerHTML = "&#x2714;"

            oreList.appendChild(item);
            oreList.appendChild(qty);
            oreList.appendChild(price);
            oreList.appendChild(check);
        } else {
            if (list[i].type === "Schematics") {
                var item = document.createElement("div");
                item.classList.add("ore-item");
                item.innerHTML = cc.trans(language, list[i].name);
                item.style.padding = "0 0 0 5px";
                item.style["border-radius"] = "3px";
    
                var qty = document.createElement("div");
                qty.classList.add("ore-quantity");
                qty.innerHTML = formatNum(list[i].quantity, quantityFractionDigits);
                totOre += list[i].quantity;
    
                var price = document.createElement("div");
                price.classList.add("ore-quantity");
                price.innerHTML = formatNum(Math.ceil(list[i].quantity/recipes[list[i].name].outputQuantity) * schematicsPrices[list[i].name], 0);
                orePrice += Math.ceil(list[i].quantity/recipes[list[i].name].outputQuantity) * schematicsPrices[list[i].name];
    
                var check = document.createElement("button");
                check.classList.add("ore-done");
                check.onclick = finishOreItem;
                check.innerHTML = "&#x2714;"
    
                oreList.appendChild(item);
                oreList.appendChild(qty);
                oreList.appendChild(price);
                oreList.appendChild(check);  
            }

            // detailed window list
            var rowClass = "details-row-1";
            if (striped) {
                rowClass = "details-row-2";
            }
            var line = [];
            var item2 = document.createElement("div");
            item2.classList.add("queue-item");
            item2.innerHTML = cc.trans(language, list[i].name);
            line.push(item2);

            var qty2 = document.createElement("div");
            qty2.classList.add("queue-quantity");
            qty2.innerHTML = formatNum(list[i].quantity, quantityFractionDigits);
            line.push(qty2);

            var bp = document.createElement("div");
            bp.classList.add("queue-quantity");
            bp.innerHTML = formatNum(list[i].bpquantity, quantityFractionDigits);
            line.push(bp);

            var time2 = document.createElement("div");
            time2.classList.add("queue-time");
            time2.innerHTML = formatTime(list[i].time);
            line.push(time2);

            var industry = document.createElement("div");
            industry.classList.add("queue-industry");
            industry.innerHTML = list[i].industry;
            line.push(industry);

            var maintain = document.createElement("div");
            maintain.classList.add("queue-quantity");
            var mv = 0;
            for (var j = i + 1; j < list.length; j++) {
                var ings = cc.db[list[j].name].getIngredients();
                for (var k = 0; k < ings.length; k++) {
                    var ing = ings[k]
                    if (ing.name === list[i].name) {
                        mv = Math.max(mv, ing.quantity);
                    }
                }
            }

            maintain.innerHTML = formatNum(mv, 0);
            line.push(maintain);

            line.forEach(function (it) {
                it.classList.add(rowClass);
                queueListDetailed.appendChild(it);
            });

            striped = !striped;

            item2.classList.add("tier-" + list[i].tier);
            item2.classList.add("tier-all");

            //main window queue list

            var item = document.createElement("div");
            item.classList.add("queue-item");
            item.innerHTML = cc.trans(language, list[i].name);


            var qty = document.createElement("div");
            qty.classList.add("queue-quantity");
            qty.innerHTML = formatNum(list[i].quantity, quantityFractionDigits);

            var time = document.createElement("div");
            time.classList.add("queue-time");
            time.innerHTML = formatTime(list[i].time);
            totTime += list[i].time;

            var check = document.createElement("button");
            check.classList.add("queue-done");
            check.onclick = finishCraftItem;
            check.innerHTML = "&#x2714;"

            queueList.appendChild(item);
            queueList.appendChild(qty);
            queueList.appendChild(time);
            queueList.appendChild(check);
        }

        item.classList.add("tier-" + list[i].tier);
        item.classList.add("tier-all");
        item.style.padding = "0 0 0 5px";
        item.style["border-radius"] = "3px";
    }

    var item = document.createElement("div");
    item.classList.add("ore-item");
    item.innerHTML = "Totals";
    item.style.padding = "0 0 0 5px";
    item.style["border-radius"] = "3px";

    var qty = document.createElement("div");
    qty.classList.add("ore-quantity");
    qty.innerHTML = formatNum(totOre, 0);
    qty.id = "totalOre";

    var price = document.createElement("div");
    price.classList.add("ore-quantity");
    price.innerHTML = formatNum(orePrice, 0);
    price.id = "totalOrePrice";

    var check = document.createElement("div");

    oreList.appendChild(item);
    oreList.appendChild(qty);
    oreList.appendChild(price);
    oreList.appendChild(check);

    totalTime.innerHTML = formatTime(totTime);
    totalOre.innerHTML = formatNum(totOre, 0);

    trySaveState();
}

//-----------------------------------------------------------------------------
// Modals for item selection and skill selection

//function to create the accordion for the item list in the modal
//cause i sure as hell won't write all that
function createItemsAcc(list, depth, filter = "", override = false) {
    if (filter == undefined) {
        filter = "";
    }

    var output = [];
    var tab = ""
    var found = false;
    for (var j = 0; j <= depth; j++) {
        tab += " ";
    }

    for (var i = 0; i < list.length; i++) {
        //console.log("list i "+list[i]);
        if (typeof list[i] == "object") {
            var or = override;
            if (filter !== "" && cc.trans(language, list[i].name).toLowerCase().search(filter.toLowerCase()) !== -1) {
                or = true;
            }
            var deeperOutput = createItemsAcc(list[i].data, depth + 1, filter, or);
            if (deeperOutput[1] || override) {
                found = true;
                output.push(tab + '<div class="accordion unselectable"><span>');
                if (!or && filter !== "" && deeperOutput[1]) {
                    output.push('-');
                } else {
                    output.push('+');
                }
                output.push('</span><span class="accordion-title">');
                output.push(cc.trans(language, list[i].name));
                output.push('</span></div>\n' + tab + '\t<div class="accordion-panel unselectable');
                if (!or && filter !== "" && deeperOutput[1]) {
                    output.push(' active" style="display:block"')
                }
                output.push('">\n');
                output.push(deeperOutput[0].join(''));
                output.push(tab + '\t</div>\n');
            }
        } else {
            if (!cc.db[list[i]]) {
                console.log('Item ' + list[i] + ' has no recipe');
                continue;
            }
            var cn = "";
            if (list[i].search("Ore") !== -1 || list[i].search("Pure") !== -1) {
                cn = list[i].split(" ")[0].toLowerCase();
            }
            if (filter === "" || cc.trans(language, list[i]).toLowerCase().search(filter.toLowerCase()) !== -1 || override) {
                output.push(tab + "\t<div class='accordion-item unselectable " + cn + "'>");
                output.push(cc.trans(language, list[i]));
                output.push("</div>\n");
            }
        }
    }
    if (output.length > 0) {
        found = true;
    }
    if (!found && depth === 0) {
        output = ['<span style="color:#fff">No results</span>'];
    }
    return [output, found];
}

var itemsAccList = createItemsAcc(itemsAccordion, 0, "")[0];
var itemsAccStr = itemsAccList.join('')
itemAccordion.innerHTML = itemsAccStr;

var keyHit = (new Date()).getTime();

async function setFilter() {

    var t = (new Date()).getTime();
    if (t - keyHit >= 2000) {
        //console.log("waiting");
        let promise = new Promise((resolve) => {
            setTimeout(() => resolve(), 2000)
        });
        let result = await promise;

        itemsAccList = createItemsAcc(itemsAccordion, 0, itemFilter.value)[0];
        itemsAccStr = itemsAccList.join('')
        itemAccordion.innerHTML = itemsAccStr;
        setupCallbacks();
    }


}

var itemFilter = document.getElementById("itemFilter");
itemFilter.onkeydown = setFilter;

document.body.addEventListener("keydown", function () {
    keyHit = (new Date()).getTime();
});

function initSkillTreeDiv() {

    function makeSkillRadio(skill) {
        const skillDiv = document.createElement("div");
        skillDiv.classList.add("tree-leaf");
        skillDiv.innerText = skill.name;
        skillDiv.setAttribute("skill-id", skill.id);
        const radioDiv = document.createElement("div");
        radioDiv.classList.add("skill-radio");
        for (let i = 0; i <= 5; i++) {
            const skillInput = document.createElement("input");
            skillInput.classList.add("skill-input");
            skillInput.type = "radio";
            skillInput.name = skill.id;
            const iSt = "" + i;
            skillInput.id = iSt;
            skillInput.value = iSt;
            skillInput.setAttribute("label", iSt);
            skillInput.checked = skillValues.getValue(skill.id) === i;
            skillInput.addEventListener("change", function () {
                const updated = skillValues.setValue(skill.id, this.value);
                if (updated) {
                    cc.updateSkills(getAllSkills(), skillValues);
                    calculate();
                }
            });
            radioDiv.appendChild(skillInput)
        }
        skillDiv.appendChild(radioDiv);
        return skillDiv;
    }

    function makeSkillNodeTitle(nodeName) {
        const nodeTitleDiv = document.createElement("div");
        nodeTitleDiv.classList.add("tree-node-title");
        const plus = document.createElement("span");
        plus.classList.add("tree-node-plus");
        plus.innerText = "+";
        const minus = document.createElement("span");
        minus.classList.add("tree-node-minus");
        minus.innerText = "-";
        const title = document.createElement("span");
        title.classList.add("tree-node-title-text");
        title.innerText = nodeName;
        nodeTitleDiv.appendChild(plus);
        nodeTitleDiv.appendChild(minus);
        nodeTitleDiv.appendChild(title);
        nodeTitleDiv.addEventListener("click", function () {
            this.classList.toggle("tree-node-title-active");
            this.parentElement.classList.toggle("tree-node-active");
        });
        return nodeTitleDiv;
    }

    const skillTreeDiv = document.getElementById("skillTreeDiv");

    while (skillTreeDiv.firstChild) {
        skillTreeDiv.removeChild(skillTreeDiv.firstChild);
    }

    skillTree.forEach(category => {
        const groupNodes = [];
        category.groups.forEach(group => {
            const skillLeafs = [];
            group.skills.forEach(skill => {
                const skillLeaf = makeSkillRadio(skill);
                skillLeafs.push(skillLeaf);
            });
            if (skillLeafs.length === 0) {
                return;
            }
            const groupNode = document.createElement("div");
            groupNode.setAttribute("skill-group-id", group.id);
            groupNode.classList.add("tree-node");
            groupNode.appendChild(makeSkillNodeTitle(group.name));
            const groupNodeBody = document.createElement("div");
            groupNodeBody.classList.add("tree-node-body");
            groupNode.appendChild(groupNodeBody);
            skillLeafs.forEach(s => groupNodeBody.appendChild(s));
            groupNodes.push(groupNode);
        });
        if (groupNodes.length === 0) {
            return;
        }
        const categoryNode = document.createElement("div");
        categoryNode.setAttribute("skill-category-id", category.id);
        categoryNode.classList.add("tree-node");
        categoryNode.appendChild(makeSkillNodeTitle(category.name));
        const categoryNodeBody = document.createElement("div");
        categoryNodeBody.classList.add("tree-node-body");
        categoryNode.appendChild(categoryNodeBody);
        groupNodes.forEach(g => categoryNodeBody.appendChild(g));
        skillTreeDiv.appendChild(categoryNode);
    });
}

function shouldDisplaySkill(skill) {
    if (!skillValues.onlyApplicableSkills) {
        return true;
    }
    if (craft.length === 0) {
        return false;
    }
    for (const item of itemLists.normal) {

        const itemRecipe = cc.db[item.name];
        if (isSkillApplicable(skill, itemRecipe)) {
            return true;
        }
    }
    return false;
}

function updateSkillTreeDiv() {
    const skillTreeDiv = document.getElementById("skillTreeDiv");
    const hiddenNodes = skillTreeDiv.getElementsByClassName("hidden-tree-node");
    while (hiddenNodes.length > 0) {
        hiddenNodes[0].classList.remove("hidden-tree-node");
    }
    if (skillValues.onlyApplicableSkills) {
        skillTree.forEach(category => {
            let emptyCategory = true;
            category.groups.forEach(group => {
                let emptyGroup = true;
                group.skills.forEach(skill => {
                    if (shouldDisplaySkill(skill)) {
                        emptyGroup = false;
                    } else {
                        const skillElement = skillTreeDiv.querySelector('[skill-id="' + skill.id + '"]');
                        if (skillElement) {
                            skillElement.classList.add("hidden-tree-node");
                        }
                    }
                });
                if (emptyGroup) {
                    const groupElement = skillTreeDiv.querySelector('[skill-group-id="' + group.id + '"]');
                    if (groupElement) {
                        groupElement.classList.add("hidden-tree-node");
                    }
                } else {
                    emptyCategory = false;
                }
            });
            if (emptyCategory) {
                const categoryElement = skillTreeDiv.querySelector('[skill-category-id="' + category.id + '"]');
                if (categoryElement) {
                    categoryElement.classList.add("hidden-tree-node");
                }
            }
        });
    }
}

function onOnlyApplicableSkills(checked) {
    if (checked == skillValues.onlyApplicableSkills) {
        return;
    }
    skillValues.onlyApplicableSkills = checked;

    updateSkillTreeDiv();
}

initSkillTreeDiv();

function updateSkills() {
    console.log("Updating skills");
    const skillInputs = document.getElementsByClassName("skill-input");
    for (let i = 0; i < skillInputs.length; i++) {
        const skillInput = skillInputs[i];
        const skillId = skillInput.getAttribute("name");
        skillInput.checked = parseInt(skillInput.value) === skillValues.getValue(skillId);
    }
    cc.updateSkills(getAllSkills(), skillValues);
    calculate();
}


//-----------------------------------------------------------------------------------
// callbacks

function newParse(numStr) {
    numStr = numStr.replace(/,/g, "");
    //console.log(numStr);
    var num = numStr.match(/[0-9]+.*[0-9]*/g);
    //console.log(num);
    return parseFloat(num[0]);
}

//callback for clicking check on ore item. removes row from oreList and places it in invList
function finishOreItem(event) {
    var qty = newParse(event.target.previousSibling.previousSibling.innerHTML);
    var name = event.target.previousSibling.previousSibling.previousSibling.innerHTML;
    name = cc.transr(language, name);

    var ast = name.search(/\*/);
    if (ast !== -1) {
        name = name.substring(0, ast - 1);
    }
    addInvItem(name, qty);
}

//callback for clicking check on queue item. removes row from oreList and places it in invList
function finishCraftItem(event) {
    var qty = newParse(event.target.previousSibling.previousSibling.innerHTML);
    var name = event.target.previousSibling.previousSibling.previousSibling.innerHTML;
    name = cc.transr(language, name);

    var ast = name.search(/\*/);
    if (ast !== -1) {
        name = name.substring(0, ast - 1);
    }

    addInvItem(name, qty);
}

// modal accordion callbacks
function setupCallbacks() {
    var acc = document.getElementsByClassName("accordion");

    for (let i = 0; i < acc.length; i++) {
        acc[i].replaceWith(acc[i].cloneNode(true));
        acc[i].addEventListener("click", function () {
            this.classList.toggle("accordion-active");
            var panel = this.nextElementSibling;
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";
            }

            if (this.children[0].innerHTML === "+") {
                this.children[0].innerHTML = "-";
            } else {
                this.children[0].innerHTML = "+";
            }
        });
    }

    var accItems = document.getElementsByClassName("accordion-item");

    for (var i = 0; i < accItems.length; i++) {
        accItems[i].addEventListener("click", addItem)
    }
}

var which = "";

//callback for displaying and hiding modal. keeps track of which button opened it with "which"
function displayItemsModal(input) {
    which = input.target
    itemsModal.style.display = "block";
}

function hideItemsModal() {
    itemsModal.style.display = "none";
}

// When the user clicks on <span> (x), close the modal
itemsModalClose.onclick = hideItemsModal;

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target.classList.contains("modal")) {
        hideItemsModal();
        hideSkillsModal();
        hideProfileModal();
        hideLangModal();
        hidePriceModal();
        hideDataModal();
    }
}
invAddBut.onclick = displayItemsModal;
cftAddBut.onclick = displayItemsModal;

function displaySkillsModal(input) {
    skillsModal.style.display = "block";
}

function hideSkillsModal() {
    skillsModal.style.display = "none";
}

// When the user clicks on <span> (x), close the modal
skillsModalClose.onclick = hideSkillsModal;

function displayProfileModal(input) {
    profileModal.style.display = "block";
}

function hideProfileModal() {
    profileModal.style.display = "none";
}

// When the user clicks on <span> (x), close the modal
profileModalClose.onclick = hideProfileModal;

function displayQueueModal(input) {
    craftQueueModal.style.display = "block";
}

function hideQueueModal() {
    craftQueueModal.style.display = "none";
}

// When the user clicks on <span> (x), close the modal
craftQueueModalClose.onclick = hideQueueModal;

function displayPriceModal(input) {
    priceModal.style.display = "block";
}

function hidePriceModal() {
    priceModal.style.display = "none";
}

// When the user clicks on <span> (x), close the modal
priceModalClose.onclick = hidePriceModal;

function displayLangModal(input) {
    langModal.style.display = "block";
}

function hideLangModal() {
    langModal.style.display = "none";
}

// When the user clicks on <span> (x), close the modal
langModalClose.onclick = hideLangModal;

function displayDataModal(input) {
    dataModal.style.display = "block";
}

function hideDataModal() {
    dataModal.style.display = "none";
}

// When the user clicks on <span> (x), close the modal
dataModalClose.onclick = hideDataModal;

priceButton.onclick = displayPriceModal;
detailedCraftQueueButton.onclick = displayQueueModal;
profileButton.onclick = displayProfileModal;
skillsButton.onclick = displaySkillsModal;
clearButton.onclick = clearLists;

invClearBut.onclick = function () {
    inv = [];
    updateInvList();
    calculate();
}
craftClearBut.onclick = function () {
    craft = [];
    updateCraftList();
    calculate();
}

getDataButton.onclick = function () {
    copyStringToClipboard(getStateJsonString(true));
}
doconfigBut.onclick = function () {
    trySaveState(configta.value);
    tryRestoreState();
    cc.updateSkills(getAllSkills(), skillValues);
    updateSkills();
    setupCallbacks();
    calculate();
}
setDataButton.onclick = displayDataModal;

var doTrans = function () {
    itemsAccList = createItemsAcc(itemsAccordion, 0, "")[0];
    itemsAccStr = itemsAccList.join('')
    itemAccordion.innerHTML = itemsAccStr;

    updateCraftList();
    updateInvList();

    calculate();
    setupCallbacks();
}

langButton.onclick = displayLangModal;
lb_english.onclick = function () {
    language = "english";
    doTrans()
};
lb_german.onclick = function () {
    language = "german";
    doTrans()
};

// updates the inv variable based on each number input
function updateInv(event) {
    var name = event.target.previousSibling.innerHTML
    name = cc.transr(language, name)
    for (var i = 0; i < inv.length; i++) {
        if (inv[i].name == name) {
            inv[i].quantity = newParse(event.target.value);
            break;
        }
    }
    //console.log(JSON.stringify(inv));
    calculate();
}

// updates the craft variable based on each number input
function updateCft(event) {
    var name = event.target.previousSibling.innerHTML
    name = cc.transr(language, name);
    //console.log("craft event name "+name);
    for (var i = 0; i < craft.length; i++) {
        if (craft[i].name == name) {
            craft[i].quantity = newParse(event.target.value);
            break;
        }
    }
    calculate();
}

// adds item row to inventory list
function addInvItem(name, quantity) {
    if (quantity == null) {
        quantity = 1;
    }

    for (var i = 0; i < inv.length; i++) {
        if (inv[i].name == name) {
            inv[i].quantity += quantity;
            updateInvList();
            calculate();
            return;
        }
    }
    inv.push({name: name, quantity: quantity});
    updateInvList();
    calculate();
}

function updateInvList() {
    while (invList.children.length > invListCols) {
        invList.removeChild(invList.children[invListCols]);
    }
    for (var i = 0; i < inv.length; i++) {
        var name = inv[i].name;
        var tp = cc.db[name].type;
        var quantity = inv[i].quantity.toString()

        var minus = document.createElement("button");
        minus.classList.add("inv-remove");
        minus.innerHTML = "&minus;"
        minus.onclick = removeItem;
        var item = document.createElement("div");
        item.classList.add("inv-item");
        item.innerHTML = cc.trans(language, name);
        //console.log(name+" "+type);
        if (tp === "Ore" || tp === "Pure") {
            item.classList.add(name.replace(" ", "_"));
            item.style.padding = "0 0 0 5px";
            item.style["border-radius"] = "3px";
        }
        item.classList.add("tier-" + cc.db[name].tier);
        item.classList.add("tier-all");
        var qty = document.createElement("input");
        qty.type = "number";
        qty.classList.add("inv-quantity");
        qty.min = "0";
        qty.value = quantity;
        qty.oninput = updateInv
        invList.appendChild(minus)
        invList.appendChild(item);
        invList.appendChild(qty);
    }
}

function addCraftItem(name, quantity) {
    craft.push({name: name, quantity: quantity});
    updateCraftList();
    calculate();
}

function updateCraftList() {
    while (cftList.children.length > craftListCols) {
        cftList.removeChild(cftList.children[craftListCols]);
    }
    for (var i = 0; i < craft.length; i++) {
        var name = craft[i].name;
        var minus = document.createElement("button");
        minus.classList.add("cft-remove");
        minus.innerHTML = "&minus;"
        minus.onclick = removeItem;
        var item = document.createElement("div");
        item.classList.add("cft-item");
        item.innerHTML = cc.trans(language, name);
        var type = cc.db[name].type;
        if (type == "Pure") {
            var cn = name.split(" ")[0].toLowerCase();
            item.classList.add(cn);
            item.style.padding = "0 0 0 5px";
            item.style["border-radius"] = "3px";
        }
        item.classList.add("tier-" + cc.db[name].tier);
        item.classList.add("tier-all");
        var qty = document.createElement("input");
        qty.type = "number";
        qty.classList.add("cft-quantity");
        qty.min = "0";
        qty.value = craft[i].quantity.toString();
        qty.oninput = updateCft;
        cftList.appendChild(minus);
        cftList.appendChild(item);
        cftList.appendChild(qty);
    }
}

//callback to add the modal item clicked on to the appropriate list
function addItem(event) {
    var name = cc.transr(language, event.target.innerHTML);
    var quantity = 1;

    if (which == invAddBut) {
        var items = document.getElementsByClassName("inv-item")
        for (var i = 0; i < items.length; i++) {
            if (items[i].innerHTML == name) {
                alert("You already have that in your inventory list!");
                return;
            }
        }
        addInvItem(name);
    } else {
        var items = document.getElementsByClassName("cft-item")
        for (var i = 0; i < items.length; i++) {
            if (items[i].innerHTML == name) {
                alert("You already have that in your craft list!");
                return;
            }
        }
        addCraftItem(name, quantity);
    }
    if (skillValues.onlyApplicableSkills) {
        updateSkillTreeDiv();
    }
}

// callback for the minus buttons to remove row from the appropriate list
function removeItem(event) {
    var minus = event.target;
    var item = minus.nextSibling;
    var qty = item.nextSibling;
    if (event.target.classList.contains("inv-remove")) {
        invList.removeChild(minus);
        invList.removeChild(item);
        invList.removeChild(qty);
        for (var i = 0; i < inv.length; i++) {
            if (inv[i].name == cc.transr(language, item.innerHTML)) {
                inv.splice(i, 1);
            }
        }
    } else {
        cftList.removeChild(minus);
        cftList.removeChild(item);
        cftList.removeChild(qty);
        for (var i = 0; i < craft.length; i++) {
            if (craft[i].name == cc.transr(language, item.innerHTML)) {
                craft.splice(i, 1);
            }
        }
    }
    calculate();
    if (skillValues.onlyApplicableSkills) {
        updateSkillTreeDiv();
    }
}

Object.keys(prices).forEach(function (ore, i) {

    var label = document.createElement("div");
    label.classList.add("accordion-item2");
    label.classList.add("unselectable");
    label.classList.add("tier-" + cc.db[ore].tier);
    label.classList.add("tier-all");
    label.innerHTML = cc.trans(language, ore);

    var qty = document.createElement("INPUT");
    qty.setAttribute("type", "text");
    qty.setAttribute("value", prices[ore].toFixed(2).toString());
    qty.style.width = "25%";
    qty.style.float = "right";
    qty.classList.add("accordion-item2");
    qty.classList.add("price-ore");
    qty.onblur = updatePrice;

    label.appendChild(qty);

    priceDialog.appendChild(label);
});

function updatePrice(event) {
    var name = event.target.parentElement.innerText;
    name = cc.transr(language, name);
    if (isNaN(parseFloat(event.target.value))) {
        alert(event.target.value + " is not a valid number");
        for (var n of Object.keys(prices)) {
            if (n == name) {
                event.target.value = prices[n];
                return;
            }
        }
    }
    for (var n of Object.keys(prices)) {
        if (n == name) {
            prices[n] = newParse(event.target.value);
            updatePrices();
            calculate();
            return;
        }
    }
}

function updatePrices() {
    for (var i = 0; i < priceDialog.children.length; i++) {
        var ore = priceDialog.children[i].innerText;
        ore = cc.transr(language, ore);
        if (priceDialog.children[i].children.length < 1) {
            continue;
        }

        var inp = priceDialog.children[i].children[0];

        for (var j = 0; j < inp.classList.length; j++) {
            if (inp.classList[j] == "price-ore") {
                inp.value = prices[ore].toFixed(2).toString();
                //console.log("updating ore price "+ore);
            }
        }
    }
}

function updateProfiles() {
    var profileDropdowns = [profileList, profileDeleteList];
    var profiles = window.localStorage.getItem("profiles");
    profileDropdowns.forEach(function (dd, i) {
        while (dd.options.length > 0) {
            dd.remove(0);
        }
    });

    if (profiles) {
        profiles = JSON.parse(profiles);
        profileDropdowns.forEach(function (dd, i) {
            profiles.forEach(function (item, i) {
                var option = document.createElement("option");
                option.text = item;
                dd.add(option)
            });
        });
    } else {
        window.localStorage.removeItem("profiles");
    }
}

function clearLists() {
    craft = [];
    updateCraftList();
    inv = [];
    updateInvList();

    window.localStorage.clear();
    clearProfiles();

    loadJSON("../data/orePrices.json", function (json) {
        prices = JSON.parse(json);
    })
    updatePrices();

    skillValues = new SkillValues();
    updateSkills();
}

function getState() {
    const state = {
        inventory: inv,
        craft: craft,
        skillValues: skillValues,
        prices: prices,
        version: version,
        language: language
    };
    return state;
}

function getStateJsonString(pretty = false) {
    const state = getState();
    state.skillValues = state.skillValues.values;
    return pretty ? JSON.stringify(state, null, 2) : JSON.stringify(state);
}

// profile saving/loading

function saveProfile() {
    var name = profileSaveInput.value;
    if (name == "") {
        return;
    }
    var state = getStateJsonString();
    window.localStorage.setItem("profile_" + name, state);
    var profiles = window.localStorage.getItem("profiles");

    if (!profiles) {
        profiles = [name];
    } else {
        profiles = JSON.parse(profiles);
        var free = true;
        for (var i = 0; i < profiles.length; i++) {
            if (profiles[i] == name) {
                free = false;
                break;
            }
        }
        if (free) {
            profiles.push(name);
        }
    }
    window.localStorage.setItem("profiles", JSON.stringify(profiles));
    updateProfiles();
}

profileSaveButton.onclick = saveProfile;

function loadProfile() {
    var name = profileList.options[profileList.selectedIndex].text;
    var profile = window.localStorage.getItem("profile_" + name);
    if (!profile) {
        alert("Profile not available");
        updateProfiles();
        return;
    }

    profileSaveInput.value = name;
    tryRestoreState(profile);
    calculate();
}

profileLoadButton.onclick = loadProfile;

function deleteProfile() {
    var name = profileDeleteList.options[profileDeleteList.selectedIndex].text;
    window.localStorage.setItem("profile_" + name, null);
    var profiles = JSON.parse(window.localStorage.getItem("profiles"));

    for (var i = 0; i < profiles.length; i++) {
        if (profiles[i] == name) {
            profiles.splice(i, 1);
            break;
        }
    }
    window.localStorage.setItem('profiles', JSON.stringify(profiles));
    updateProfiles();
}

profileDeleteButton.onclick = deleteProfile;

function clearProfiles() {
    var profiles = window.localStorage.getItem("profiles");
    if (profiles) {
        profiles = JSON.parse(profiles);
        for (var profile in profiles) {
            window.localStorage.removeItem("profile_" + profile);
        }
        window.localStorage.removeItem("profiles");
    }
    profileSaveInput.value = "";
    updateProfiles();
};

clearProfiles.onclick = clearProfiles;


updateProfiles();

// calculator state saving/loading

function tryRestoreState(profile) {
    if (profile == null) {
        profile = window.localStorage.getItem("crafting_state");
    }
    try {
        if (!profile) {
            return;
        }

        const state = JSON.parse(profile);

        if (state.version != version) {
            alert("Old profile detected. You may have to reset the calculator (button at the top) to get it to work.");
        }
        //console.log("restoring...");

        const oldState = getState();

        // restore skils
        try {
            if (Object.keys(state.skillValues) === 0) {
                throw 'skills are empty'
            }
            skillValues = new SkillValues();
            skillValues.values = state.skillValues;
            updateSkills();
        } catch (e) {
            console.log("failed to load skills");
            skillValues = oldState.skillValues;
        }
        // restore inventory
        try {
            inv = state.inventory;
            if (Object.keys(inv) === 0) {
                throw 'inv is empty'
            }
            updateInvList();
        } catch (e) {
            console.log("failed to load inv");
            inv = oldState.inventory;
        }

        // restore items to craft
        try {
            craft = state.craft;
            if (Object.keys(craft) === 0) {
                throw 'craft is empty'
            }
            updateCraftList();
        } catch (e) {
            console.log("failed to load craft");
            craft = oldState.craft;
        }

        //restore prices
        try {
            prices = state.prices;
            if (Object.keys(prices) === 0) {
                throw 'prices are empty'
            }
            updatePrices();
        } catch (e) {
            console.log("failed to load prices");
            prices = oldState.prices;
        }

        try {
            languageChanges[state.language]();
        } catch (e) {
            console.log("failed to change languages");
        }
    } catch (e) {
        console.log('Could not restore the previous crafting calculator state.', e);
    }
}

function trySaveState(data = "") {
    try {
        if (!window.localStorage) {
            return;
        }
        if (data == "") {
            window.localStorage.setItem('crafting_state', getStateJsonString());
        } else {
            window.localStorage.setItem('crafting_state', data);
        }
    } catch (e) {
        console.log('Could not save crafting calculator state.', e);
    }
}

tryRestoreState();
cc.updateSkills(getAllSkills(), skillValues);
updateSkills();
setupCallbacks();
calculate();
