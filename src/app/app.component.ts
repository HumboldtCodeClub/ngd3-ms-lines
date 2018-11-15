import { Component } from '@angular/core';

import { LineData } from './ms-line-chart.component';

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
  series: LineData[] = [];
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
    // Temporary array of line data
    const temp: LineData[] = [];

    // How many lines should we display?
    const seriesCount = Math.floor(Math.random() * 11);
    console.log(`creating ${seriesCount} data entries`);

    // Create line data for each line we want
    for (let i = 0; i < seriesCount; i++) {
      // Data for this line
      const data = new LineData;
      data.id = `${i}`;

      // temporary point array
      const points = [];
      // How many points do we want for this line?
      const dataPoints = Math.floor(Math.random() * 199) + 2;
      for (let j = 0; j < dataPoints; j++) {
        // Calculate this points x and y values and add it to the temp array of points
        const a = Math.floor(Math.random() * 1000);
        const b = Math.floor(Math.random() * 100);
        points.push([a,b]);
      }
      
      // Set the point values for this line
      data.points = points;

      // Add this line to the set of lines
      temp.push(data);
    }

    // Set our actual data to the temp set of lines we just generated
    this.series = temp;
  }
}
