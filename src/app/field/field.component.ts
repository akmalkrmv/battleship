import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { Field, Ship } from '../models/ship';

@Component({
  selector: 'app-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldComponent implements OnInit {
  @Input() field: Field;
  @Input() ship: Ship;
  @Input() hit: Field;

  constructor() { }

  ngOnInit(): void {
  }

}
