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
    // temporary array of line data
    const temp: LineData[] = [];

    // how many lines should we display?
    let seriesCount = this.lineCount;
    if (this.randomLineCount) {
      seriesCount = Math.floor(Math.random() * (this.lineCount + 1));
    }

    // Create line data for each line we want
    for (let i = 0; i < seriesCount; i++) {
      // data for this line
      const data = new LineData;
      data.id = `${i}`;

      // temporary point array
      const points = [];
      // how many points do we want for this line?
      let dataPoints = this.pointCount;
      if (this.randomPointCount) {
        dataPoints = Math.floor(Math.random() * (this.pointCount + 1));
      }
      for (let j = 0; j < dataPoints; j++) {
        // calculate this points x and y values and add it to the temp array of points
        const a = Math.floor(Math.random() * 1001);
        const b = Math.floor(Math.random() * 101);
        points.push([a,b]);
      }

      // sorting points isn't needed for binned charts, 
      // but if we don't sort when plotting each point it results in a 'scribbled' line
      points.sort(function(a, b) { return a[0] - b[0]});
      
      // set the point values for this line
      data.points = points;

      // sdd this line to the set of lines
      temp.push(data);
    }

    // set our actual data to the temp set of lines we just generated
    this.series = temp;
  }
}
