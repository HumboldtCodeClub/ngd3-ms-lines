import { Component, Input, HostListener, ElementRef, AfterViewInit, OnChanges } from '@angular/core';
import * as d3 from 'd3';
import { interpolatePath } from 'd3-interpolate-path';

export class LineData {
  id: string = '';
  points: any[] = [];
}

@Component({
  selector: 'ms-line-chart',
  template: '<ng-content></ng-content>'
})
export class MSLineChartComponent implements AfterViewInit, OnChanges {
  
  @Input() dataset: LineData[] = [];
  @Input() binned = true;
  @Input() frequency = true;
  @Input() binCount = 40;

  private margin = { top:40, right: 40, bottom: 40, left: 40 };
  private dimensions = { width: 0, height: 0 };
  private scale = { x: d3.scaleLinear(), y: d3.scaleLinear() };
  private axes = { x: null, y: null };
  private svg: any;
  private axesGroup: any;
  private lineGroup: any;

  /**
   * Comments go here
   * 
   * @param el Element Reference
   */
  constructor(private el: ElementRef) {
    // Add the svg element with a static height and bootstrap full width class
    this.svg = d3.select(this.el.nativeElement)
      .append('svg')
      .attr('class', 'ms-line-chart')
      .attr('height', 225)
      .attr('class', 'w-100');

    // Add a group element to the svg to hold the axes
    this.axesGroup = this.svg.append('g')
      .attr('class', 'axes-group')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Add a group element to the svg to hold the lines
    this.lineGroup = this.svg.append('g')
      .attr('class', 'line-group')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Add the x-axis group
    this.axes.x = this.axesGroup.append('g').attr('class','x-axis');
  
    // Add the y-axis group
    this.axes.y = this.axesGroup.append('g').attr('class','y-axis');
  }

  /**
   * 
   */
  ngAfterViewInit() {
    this.setDimensions();
    this.setXScale();
    this.setXAxis();
    this.setYScale();
    this.setYAxis();
    this.update();
  }


  /**
   * 
   */
  ngOnChanges() {
    this.setXScale();
    this.setXAxis();
    this.setYScale();
    this.setYAxis();
    this.update();
  }

  @HostListener('window:resize') onresize(event: any) {
    this.setDimensions();
    this.setXScale();
    this.setXAxis();
    this.setYScale();
    this.setYAxis();
    this.update();
  }

  /**
   * 
   */
  private update() {
    const lineTransition = d3.transition().duration(1000);

    const flatlineGenerator = d3.line()
      .x((d) => this.scale.x(d))
      .y(this.dimensions.height)
      .curve(d3.curveMonotoneX);

    const binlineGenerator = d3.line()
      .x((d) => this.scale.x(d.x0))
      .y((d) => {
        if (this.frequency) {
          return this.scale.y(d.length);
        } else {
          let avg = d3.mean(d, (p) => p[1]);
          avg = isNaN(avg) ? 0 : avg;
          return this.scale.y(avg);
        }
      })
      .curve(d3.curveMonotoneX);

    // JOIN
    const paths = this.lineGroup.selectAll('.ms-path')
      .data(this.dataset, (d) => d.id);

    // EXIT
    paths.exit().transition(lineTransition)
      .attrTween('d', (d) => {
        const previous = d3.select(`#ms-path-${d.id}`).attr('d');
        const bins = d3.histogram()
          .domain(this.scale.x.domain())
          .thresholds(this.scale.x.ticks(this.binCount))
          ([]);
        const current = binlineGenerator(bins);
        return interpolatePath(previous, current);
      })
      .remove();

    // UPDATE
    paths.transition(lineTransition)
      //.attr('d', (d) => newlineGenerator(d.points));
      .attrTween('d', (d) => {
        const previous = d3.select(`#ms-path-${d.id}`).attr('d');
        const bins = d3.histogram()
          .domain(this.scale.x.domain())
          .thresholds(this.scale.x.ticks(this.binCount))
          .value((d) => d[0])
          (d.points);
        const current = binlineGenerator(bins);
        return interpolatePath(previous, current);
      });

    // ENTER
    paths.enter().append('path')
      .attr('id', (d) => `ms-path-${d.id}`)
      .attr('class', (d) => `ms-path ms-color-${d.id}`)
      //.attr('style', 'stroke:blue')
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', flatlineGenerator([0,1000]))
      .transition(lineTransition)
      .attrTween('d', (d) => {
        const previous = d3.select(`#ms-path-${d.id}`).attr('d');
        const bins = d3.histogram()
          .domain(this.scale.x.domain())
          .thresholds(this.scale.x.ticks(this.binCount))
          .value((d) => d[0])
          (d.points);
        const current = binlineGenerator(bins);
        return interpolatePath(previous, current);
      });
  }

  /**
   * 
   */
  private setDimensions() {
    const containerWidth = this.el.nativeElement.parentNode.offsetWidth;
    this.dimensions.width = containerWidth - this.margin.left - this.margin.right;
    this.dimensions.width = this.dimensions.width < 0 ? 0 : this.dimensions.width;

    this.dimensions.height = this.svg.attr('height') - this.margin.top - this.margin.bottom;
    this.dimensions.height = this.dimensions.height < 0 ? 0 : this.dimensions.height;
  }

  /**
   * 
   */
  private setXScale() {
    const dmin = 0;
    const dmax = 1000;
    const rmin = this.margin.left;
    let rmax = this.dimensions.width;
    rmax = rmax < rmin ? rmin : rmax;

    this.scale.x = d3.scaleLinear()
      .domain([dmin, dmax])
      .range([rmin, rmax]);
  }


  /**
   * 
   */
  private setYScale() {

    // calculate domain
    const dmin = 0;
    let dmax = d3.max(this.dataset, (d) => {
      const bins = d3.histogram()
        .domain(this.scale.x.domain())
        .thresholds(this.scale.x.ticks(this.binCount))
        .value((d) => d[0])
        (d.points);

      if (this.frequency) {
        return d3.max(bins, (b) => b.length);
      } else {
        return d3.max(bins, (b) => d3.mean(b, (p) => p[1]));
      }
    });
    dmax = isNaN(dmax) ? 10 : dmax;

    // calculate range
    const rmin = this.dimensions.height;
    const rmax = 0;

    this.scale.y = d3.scaleLinear()
      .domain([dmin, dmax])
      .range([rmin, rmax]);
  }

  /**
   * 
   */
  private setXAxis() {
    this.axes.x
      .attr('transform', `translate(0,${this.dimensions.height})`)
      .call(d3.axisBottom(this.scale.x));
  }

  /**
   * 
   */
  private setYAxis() {
    this.axes.y
      .attr('transform', `translate(${this.margin.left}, 0)`)
      .call(d3.axisLeft(this.scale.y));
  }
}