import { observable, computed, action, reaction } from 'mobx';
import Option from './Option';
import * as raxmlSettings from '../../settings/raxml';
import * as yup from 'yup';

const CODON_NONE = 'None';
const CODON_SPECIFIC = 'Codon specific';
const CODON_THIRD = 'Third codon';
export const CodonModels = [CODON_NONE, CODON_SPECIFIC, CODON_THIRD];

const getPartitionType = (dataType, aaMatrixName = 'BLOSUM62') => {
  // for old raxml
  switch (dataType) {
    case 'dna':
    case 'nucleotide':
      return 'DNA';
    case 'protein':
      return aaMatrixName;
    case 'binary':
      return 'BIN';
    case 'multistate':
      return 'MULTI';
    default:
      return dataType;
  }
}

class PartBase extends Option {
  constructor(part, defaultValue, title, description, hoverInfo, {
    schema = undefined,
    allowOnlyValidChange = false,
    helperText = '',
  } = {}) {
    super(part.partition.alignment.run, defaultValue, title, description, hoverInfo, {
      schema,
      allowOnlyValidChange,
      helperText,
    });
    this.part = part;
  }
  @computed get alignment() { return this.part.partition.alignment; }
}

class PartType extends PartBase {
  constructor(part, value='DNA') {
    super(part, value, 'Data type', 'Data type of the part', '', {
      schema: yup.string(),
      allowOnlyValidChange: true,
    });
  }
  @computed get finalValue() {
    const { dataType, partitionType } = this.alignment;
    if (dataType === 'protein' || this.value === 'protein') {
      return this.part.aaType.value;
    }
    if (dataType === 'mixed') {
      return this.value;
    }
    return partitionType;
  }
  @computed get options() {
    const { dataType } = this.alignment;
    let opts = [dataType];
    if (dataType === '' || dataType === 'mixed') {
      opts = ['DNA', 'BIN', 'MULTI', 'protein'];
    }
    return opts.map(value => ({ value, title: value }));
  }
  @computed get notAvailable() { return this.alignment.dataType !== 'mixed'; }
}
class PartAAType extends PartBase {
  constructor(part, value='BLOSUM62') {
    super(part, value, 'Model', 'Substitution model for the part', '', {
      schema: yup.string(),
      allowOnlyValidChange: true,
    });
  }
  options = raxmlSettings.aminoAcidSubstitutionMatrixOptions.options.map(value => ({ value, title: value }));
  @computed get notAvailable() { return this.alignment.dataType !== 'protein'; }
}
class PartName extends PartBase {
  constructor(part, value='part1') {
    super(part, value, 'Name', 'Name of part', '', {
      schema: yup.string(), // TODO: Check that it is unique within partition
      allowOnlyValidChange: true,
    });
  }
  @computed get notAvailable() { return false; }
}
class PartStart extends PartBase {
  constructor(part, value=1) {
    super(part, value, 'from', 'Start position for this part', '', {
      schema: yup.number(),
      allowOnlyValidChange: false,
    });
    this.disabled = true;
  }
  @computed get notAvailable() { return false; }
}

class PartEnd extends PartBase {
  constructor(part, value=1) {
    super(part, value, 'to', 'Ending position (inclusive) for this part', 'Ending position (inclusive) for this part', {
      schema: yup.number().test({
        name: 'part-end',
        message: () => `Must be in interval [${this.min}, ${this.max}]`,
        test: (value) => {
          return value >= this.min && value <= this.max;
        }
      }),
      allowOnlyValidChange: false,
    });
  }
  @computed get min() { return this.part.start.value + (this.part.codon.value === CODON_NONE ? 0 : 2); }
  @computed get max() { return this.alignment.length; }
  @computed get notAvailable() { return false; }
}

class PartCodon extends PartBase {
  constructor(part, value='None') {
    super(part, value, 'Codon model', '', '', {
      schema: yup.string(),
      allowOnlyValidChange: true,
    });
  }
  options = CodonModels.map(value => ({ value, title: value }));
  @computed get notAvailable() {
    return this.alignment.partition.partToAdd.type.value !== 'DNA';
  }
}

class Part {
  constructor(partition, { type, aaType, name, start, end, codon }) {
    this.partition = partition;
    this.type = new PartType(this, type)
    this.aaType = new PartAAType(this, aaType)
    this.name = new PartName(this, name)
    this.start = new PartStart(this, start)
    this.end = new PartEnd(this, end)
    this.codon = new PartCodon(this, codon)
  }

  @computed get typePadded() { return `${this.type.finalValue},`.padEnd(12); }

  /**
   * codon 0: No codon
   * codon 1,2 or 3: Codon specific, add offset 0,1 and 2 respectively and append \3
   * codon 12: Third codon, add offset 1 on same row and append \3 on the two ranges
   */
  _transform = (offset = 0, namePrefix = '', codon = 0, ) => {
    const nameSuffix = codon === 0 ? '' : codon === 12 ? '_codon1and2' : `_codon${codon}`;
    const partWithoutRange = `${this.typePadded}${namePrefix}${this.name.value}${nameSuffix} = `;
    const start = this.start.value + offset;
    const end = this.end.value + offset;
    let range = `${start}-${end}`;
    if (codon === 12) {
      range = `${range}\\3, ${start+1}-${end}\\3`;
    } else if (codon > 0 && codon <= 3) {
      range = `${start+codon-1}-${end}\\3`;
    }
    return `${partWithoutRange}${range}`;
  }

  transform = (offset = 0, namePrefix = '') => {
    switch (this.codon.value) {
      case CODON_NONE:
        return this._transform(offset, namePrefix);
      case CODON_SPECIFIC:
        return [1,2,3].map(codon => this._transform(offset, namePrefix, codon)).join('\n');
      case CODON_THIRD:
        return [12,3].map(codon => this._transform(offset, namePrefix, codon)).join('\n');
    }
  }

  @computed get text() {
    // return `${this.typePadded}${this.name.value} = ${this.start.value}-${this.end.value}`;
    return this.transform();
  }

  parse = (row) => {

  }

  @computed get values() {
    return {
      type: this.type.value,
      aaType: this.aaType.value,
      name: this.name.value,
      start: this.start.value,
      end: this.end.value,
      codon: this.codon.value,
    };
  }

  clone = () => {
    return new Part(this.partition, this.values);
  }
}
class Partition {
  constructor(alignment) {
    this.alignment = alignment;
    this.defaultPartition = new Part(this, {
      type: alignment.partitionType,
      aaType: 'BLOSUM62',
      name: 'part_1',
      start: 1,
      end: alignment.length,
      codon: 'None',
    });
    this.partToAdd = new Part(this, {
      type: alignment.partitionType,
      aaType: 'BLOSUM62',
      name: 'part_1',
      start: 1,
      end: 1,
      codon: 'None',
    });
    reaction(() => alignment.length, (length, reaction) => {
      reaction.dispose();
      // Make default alignment complete except for mixed type
      if (this.alignment.dataType !== 'mixed') {
        this.defaultPartition.end.value = length;
      }
    }, { name: 'React to alignment length'});
    reaction(
      () => ({
        dataType: alignment.dataType,
        aaMatrixName: alignment.aaMatrixName,
      }),
      ({ dataType, aaMatrixName }) => {
        const type = dataType === 'protein' ? 'protein' : getPartitionType(dataType, aaMatrixName);
        this.partToAdd.type.value = this.defaultPartition.type.value = type;
        this.defaultPartition.aaType.value = aaMatrixName;
        this.partToAdd.aaType.value = aaMatrixName;
      },
      { name: 'React to default partition type change' }
    );
  }
  @observable parts = [];
  // Add current part values
  addPart = () => {
    this.parts.push(this.partToAdd.clone());
    // Reset or update in partToAdd
    this.partToAdd.codon.value = CODON_NONE;
    if (!this.isComplete) {
      // Start new range after last end position
      this.partToAdd.start.value = this.partToAdd.end.value = this.partToAdd.end.value + 1;
      // Increment counter on name
      const oldName = this.partToAdd.name.value;
      let newName = oldName.replace(/(\d+)$/, (_, digits) => `${Number(digits) + 1}`);
      if (newName === oldName) {
        newName = `${newName}_1`;
      }
      this.partToAdd.name.value = newName;
    }
  }
  @computed get isMixed() { return this.alignment.dataType === 'mixed'; }
  @computed get isDefault() { return this.parts.length === 0; }
  @computed get maxEndValue() { return this.alignment.length; }

  @computed get currentEndValue() {
    return this.isDefault ? this.defaultPartition.end.value : this.parts[this.parts.length - 1].end.value;
  }
  @computed get isComplete() {
    return this.currentEndValue === this.maxEndValue;
  }
  @computed get nonDefaultPartitionComplete() {
    return !this.isDefault && this.isComplete;
  }
  @computed get progress() {
    return this.isDefault ? 100 : this.currentEndValue * 100.0 / this.alignment.length;
  }
  @computed get haveError() {
    return this.partToAdd.end.haveError;
  }
  @computed get errorMessage() {
    return this.haveError ? `End position error: ${this.partToAdd.end.errorMessage}` : '';
  }
  @computed get addPartDisabled() {
    return this.nonDefaultPartitionComplete || this.haveError;
  }
  @computed get text() {
    if (this.isDefault) {
      // return this.alignment.partitionFileContent;
      return this.defaultPartition.text;
    }
    return this.parts.map(part => part.text).join('\n');
  }
  transform = (offset = 0, prefix = '') => {
    if (this.isDefault) {
      return this.defaultPartition.transform(offset, prefix);
    }
    return this.parts.map(part => part.transform(offset, prefix)).join('\n');
  }

  @action reset = () => {
    if (this.parts.length > 0) {
      this.parts.splice(0);
      this.partToAdd.name.value = 'part_1';
      this.partToAdd.start.value = 1;
      this.partToAdd.end.value = 1;
    }
  }
}

class FinalPartition {
  constructor(run) {
    this.run = run;
  }
  /*
    Example:
    DNA, gene1 = 1-3676
    BIN, morph = 3677-3851
  */
  @computed get text() {
    if (!this.run.haveAlignments) {
      return '';
    }
    const partitionTexts = [];
    let total = 0;
    this.run.alignments.forEach((alignment, index) => {
      partitionTexts.push(alignment.partition.transform(total, `${index}_`))
      total += alignment.length;
    });
    return partitionTexts.join('\n');
  }
  @computed get isDefault() {
    return this.run.alignments.length === 0 ||
      this.run.alignments.length === 1 && this.run.alignments[0].partition.isDefault;
  }
  @computed get isComplete() {
    return this.run.alignments.every(alignment => alignment.partition.isComplete);
  }
}

export {
  Partition as default,
  FinalPartition,
}
