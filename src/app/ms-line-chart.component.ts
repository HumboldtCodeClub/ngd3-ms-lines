import { Component, Input, HostListener, ElementRef, AfterViewInit, OnChanges } from '@angular/core';
import * as d3 from 'd3';
import { interpolatePath } from 'd3-interpolate-path';

/**
 *
 */
export class LineData {
  id = '';
  points: any[] = [];
}

/**
 *
 */
export enum BinTypeEnum {
  AVERAGE = 'Average', // Use the average of all y values in each bin.
  FREQUENCY = 'Frequency', //
}

/**
 *
 */
export enum CurveTypeEnum {
  BASIS = 'Basis', // a cubic basis spline, repeating the end points.
  BASIS_CLOSED = 'Basis Closed', // a closed cubic basis spline.
  BASIS_OPEN = 'Basis Open', // a cubic basis spline.
  BUNDLE = 'Bundle', // a straightened cubic basis spline.
  CARDINAL = 'Cardinal', // a cubic cardinal spline, with one//sided difference at each end.
  CARDINAL_CLOSED = 'Cardinal Closed', // a closed cubic cardinal spline.
  CARDINAL_OPEN = 'Cardinal Open', // a cubic cardinal spline.
  CATMULL_ROM = 'Catmull-Rom', // a cubic Catmull–Rom spline, with one//sided difference at each end.
  CATMULL_ROM_CLOSED = 'Catmull-Rom Closed', // a closed cubic Catmull–Rom spline.
  CATMULL_ROM_OPEN = 'Catmull-Rom Open', // a cubic Catmull–Rom spline.
  LINEAR = 'Linear', // a polyline.
  LINEAR_CLOSED = 'Linear Closed', // a closed polyline.
  MONOTONE_X = 'Monotone X', // a cubic spline that, given monotonicity in x, preserves it in y.
  MONOTONE_Y = 'Monotone Y', // a cubic spline that, given monotonicity in y, preserves it in x.
  NATURAL = 'Natural', // a natural cubic spline.
  STEP = 'Step', // a piecewise constant function.
  STEP_AFTER = 'Step After', // a piecewise constant function.
  STEP_BEFORE = 'Step Before', // a piecewise constant function.
}

/**
 *
 */
@Component({
  selector: 'ms-line-chart',
  template: '<ng-content></ng-content>'
})
export class MSLineChartComponent implements AfterViewInit, OnChanges {

  /*  */
  @Input() dataset: LineData[] = [];
  /* */
  @Input() binned = true;
  /* */
  @Input() binType = BinTypeEnum.FREQUENCY;
  /* */
  @Input() binCount = 40;
  /* */
  @Input() scaleXtoDataset = false;
  /* */
  @Input() curveType = CurveTypeEnum.MONOTONE_X;

  /* */
  private margin = { top: 40, right: 40, bottom: 40, left: 40 };
  /* */
  private dimensions = { width: 0, height: 0 };
  /* */
  private scale = { x: d3.scaleLinear(), y: d3.scaleLinear() };
  /* */
  private axes = { x: null, y: null };
  /* */
  private svg: any;
  /* */
  private axesGroup: any;
  /* */
  private lineGroup: any;
  /* */
  private dot: any;
  /* */
  private customBins: number[] = [];

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
      .attr('class', 'w-100')
      .on('mouseout', this.leftChart())
      .on('mousemove', this.moved());

    // Add a group element to the svg to hold the axes
    this.axesGroup = this.svg.append('g')
      .attr('class', 'axes-group')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Add a group element to the svg to hold the lines
    this.lineGroup = this.svg.append('g')
      .attr('class', 'line-group')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Add the x-axis group
    this.axes.x = this.axesGroup.append('g').attr('class', 'x-axis');

    // Add the y-axis group
    this.axes.y = this.axesGroup.append('g').attr('class', 'y-axis');

    this.dot = this.svg.append('g')
      .attr('class', 'dot-group');
    //   // .attr('display', 'none');

    this.dot.append('circle')
      .attr('r', 2.5);
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
    this.selectCurveType();
    this.setXScale();
    this.setXAxis();
    this.setYScale();
    this.setYAxis();
    this.update();
  }

  /**
   *
   * @param event description
   */
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
      .curve(this.selectCurveType());

    const lineGenerator = d3.line()
      .x((d) => this.scale.x(d[0]))
      .y((d) => this.scale.y(d[1]))
      .curve(this.selectCurveType());

    const binlineGenerator = d3.line()
      .x((d) => this.scale.x(d.x0))
      .y((d) => {
        if (this.binType === BinTypeEnum.FREQUENCY) {
          return this.scale.y(d.length);
        } else {
          let avg = d3.mean(d, (p) => p[1]);
          avg = isNaN(avg) ? 0 : avg;
          return this.scale.y(avg);
        }
      })
      .curve(this.selectCurveType());

    // JOIN
    const paths = this.lineGroup.selectAll('.ms-path')
      .data(this.dataset, (d) => d.id);

    // EXIT
    paths.exit().transition(lineTransition)
      .attrTween('d', (d) => {
        const previous = d3.select(`#ms-path-${d.id}`).attr('d');
        const bins = d3.histogram()
          .domain(this.scale.x.domain())
          .thresholds(this.customBins)
          ([]);
        const current = binlineGenerator(bins);
        return interpolatePath(previous, current);
      })
      .remove();

    // UPDATE
    paths.transition(lineTransition)
      .attrTween('d', (d) => {
        const previous = d3.select(`#ms-path-${d.id}`).attr('d');
        let current = null;
        if (this.binned) {
          const bins = d3.histogram()
            .domain(this.scale.x.domain())
            .thresholds(this.customBins)
            .value((p) => p[0])
            (d.points);
          current = binlineGenerator(bins);
        } else {
          current = lineGenerator(d.points);
        }
        return interpolatePath(previous, current);
      });

    // ENTER
    paths.enter().append('path')
      .attr('id', (d) => `ms-path-${d.id}`)
      .attr('class', (d) => `ms-path ms-color-${d.id}`)
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', flatlineGenerator([0, 1000]))
      .on('mouseenter', this.enteredPath)
      .on('mouseout', () => d3.event.cancelBubble = true)
      .transition(lineTransition)
      .attrTween('d', (d) => {
        const previous = d3.select(`#ms-path-${d.id}`).attr('d');
        let current = null;
        if (this.binned) {
          const bins = d3.histogram()
            .domain(this.scale.x.domain())
            .thresholds(this.customBins)
            .value((p) => p[0])
            (d.points);
          current = binlineGenerator(bins);
        } else {
          current = lineGenerator(d.points);
        }
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
    let dmin = 0;
    let dmax = 1000;
    if (this.scaleXtoDataset) {
      dmin = d3.min(this.dataset, (d) => {
        return d3.min(d.points, (p) => p[0]);
      });
      dmin = isNaN(dmin) ? 0 : dmin;

      dmax = d3.max(this.dataset, (d) => {
        return d3.max(d.points, (p) => p[0]);
      });
      dmax = isNaN(dmax) ? 100 : dmax;
    }

    const rmin = this.margin.left;
    let rmax = this.dimensions.width;
    rmax = rmax < rmin ? rmin : rmax;

    this.scale.x = d3.scaleLinear()
      .domain([dmin, dmax])
      .range([rmin, rmax]);

    // Calculate custom bins
    this.customBins = [];
    if (this.binCount <= 0) { return; }
    const binWidth = dmax / this.binCount;
    let currentBin = 0;
    let ittr = 0;
    while (currentBin < dmax) {
      currentBin = binWidth * ittr;
      if (dmin <= currentBin && currentBin <= dmax) {
        this.customBins.push(currentBin);
      }
      ittr += 1;
    }
    console.log(this.customBins);
  }


  /**
   *
   */
  private setYScale() {

    // calculate domain
    const dmin = 0;
    let dmax = 0;

    if (this.binned) {
      dmax = d3.max(this.dataset, (d) => {
        const bins = d3.histogram()
          .domain(this.scale.x.domain())
          .thresholds(this.customBins)
          .value((p) => p[0])
          (d.points);

        if (this.binType === BinTypeEnum.FREQUENCY) {
          return d3.max(bins, (b) => b.length);
        } else {
          return d3.max(bins, (b) => d3.mean(b, (p) => p[1]));
        }
      });
    } else {
      dmax = d3.max(this.dataset, (d) => {
        return d3.max(d.points, (p) => p[1]);
      });
    }

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

  /**
   *
   */
  private selectCurveType() {
    switch (this.curveType) {
      case CurveTypeEnum.BASIS: {
        return d3.curveBasis;
      }
      case CurveTypeEnum.BASIS_CLOSED: {
        return d3.curveBasisClosed;
      }
      case CurveTypeEnum.BASIS_OPEN: {
        return d3.curveBasisOpen;
      }
      case CurveTypeEnum.BUNDLE: {
        return d3.curveBundle;
      }
      case CurveTypeEnum.CARDINAL: {
        return d3.curveCardinal;
      }
      case CurveTypeEnum.CARDINAL_CLOSED: {
        return d3.curveCardinalClosed;
      }
      case CurveTypeEnum.CARDINAL_OPEN: {
        return d3.curveCardinalOpen;
      }
      case CurveTypeEnum.CATMULL_ROM: {
        return d3.curveCatmullRom;
      }
      case CurveTypeEnum.CATMULL_ROM_CLOSED: {
        return d3.curveCatmullRomClosed;
      }
      case CurveTypeEnum.CATMULL_ROM_OPEN: {
        return d3.curveCatmullRomOpen;
      }
      case CurveTypeEnum.LINEAR: {
        return d3.curveLinear;
      }
      case CurveTypeEnum.LINEAR_CLOSED: {
        return d3.curveLinearClosed;
      }
      case CurveTypeEnum.MONOTONE_X: {
        return d3.curveMonotoneX;
      }
      case CurveTypeEnum.MONOTONE_Y: {
        return d3.curveMonotoneY;
      }
      case CurveTypeEnum.NATURAL: {
        return d3.curveNatural;
      }
      case CurveTypeEnum.STEP: {
        return d3.curveStep;
      }
      case CurveTypeEnum.STEP_AFTER: {
        return d3.curveStepAfter;
      }
      case CurveTypeEnum.STEP_BEFORE: {
        return d3.curveStepBefore;
      }
      default: {
        return d3.curveMonotoneX;
      }
    }
  }

  /**
   *
   */
  private enteredPath() {
    d3.selectAll('.ms-path')
      .transition().duration(500)
      .style('stroke-opacity', 0.1);
    d3.select(this)
      .transition().duration(500)
      .style('stroke-opacity', 1);
  }

  /**
   *
   */
  private leftChart(): (d, i) => void {
    return (d, i) => {
      this.lineGroup.selectAll('.ms-path')
        .transition().duration(500)
        .style('stroke-opacity', 1);
    };
  }

  /**
   *
   */
  private moved(): (d, i) => void {
    return (d, i) => {
      const mouseY = this.scale.y(d3.event.layerY);
      const mouseX = this.scale.x(d3.event.layerX);

      const i1 = d3.bisectLeft(this.customBins, d3.event.layerX, 1);
      const i0 = i1 - 1;
      const i2 = mouseX - this.customBins[i0] > this.customBins[i1] - mouseX ? i1 : i0;
      console.log(`i1: ${i1}, ${this.customBins[i1]}`);

      // const s = this.dataset.poi.reduce((a, b) => Math.abs(a.values[i] - ym) < Math.abs(b.values[i] - ym) ? a : b);



      this.dot.attr('transform', `translate(${this.scale.x(this.customBins[i0])}, ${d3.event.layerY})`);
    };
  }

}
