import { Component } from '@angular/core';

export interface BinType {
  value: boolean;
  viewValue: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  chartCount = 1;
  lineCount = 3;
  pointCount = 20;
  randomLineCount = false;
  randomPointCount = false;
  binned = true;
  binCount = 50;
  frequency = true;

  binTypes: BinType[] = [
    { value: true, viewValue: 'Frequency'},
    { value: true, viewValue: 'Average' }
  ];

  refreshData() {

  }
}
