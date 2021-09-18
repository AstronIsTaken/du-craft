export class Recipe {
  name: string;
  tier: bigint;
  type: string;
  subtype: string;
  volume: number;
  time: number;
  nanopack: boolean;
  industry: string;
  input: Map<string, number>;
  byproducts: Map<string, number>;
  outputQuantity: number;

  constructor(params: {
    name: string,
    tier: bigint,
    type: string,
    subtype: string,
    volume: number,
    time: number,
    nanopack: boolean,
    industry: string,
    input: Map<string, number>,
    byproducts: Map<string, number>,
    outputQuantity: number
  }) {
    this.name = params.name;
    this.tier = params.tier;
    this.type = params.type;
    this.subtype = params.subtype;
    this.volume = params.volume;
    this.time = params.time;
    this.nanopack = params.nanopack;
    this.industry = params.industry;
    this.input = params.input;
    this.byproducts = params.byproducts;
    this.outputQuantity = params.outputQuantity;
  }
}
