import { FIELD_RANGE } from '@constants/fields';
import { Ship } from './ship';

export type FieldJSON = { [index: string]: Ship };

export class Field {
  public hit: boolean;
  public sunk: boolean;

  constructor(public index: number, public ship?: Ship) {}

  public static toJSON(fields: Field[]) {
    const result: FieldJSON = {};

    fields
      .filter((field) => field.ship)
      .map((field) => (result[field.index] = { ...field.ship }));

    return result;
  }

  public static fromJSON(fields: FieldJSON) {
    const result = Array.from({ length: FIELD_RANGE }).map((field, index) =>
      fields[index] ? new Field(index, fields[index]) : new Field(index)
    );

    return result;
  }
}
