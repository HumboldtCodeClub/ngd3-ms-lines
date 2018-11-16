import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule, MatCardModule, MatCheckboxModule,
         MatFormFieldModule, MatInputModule, MatRadioModule } from '@angular/material';

import { AppComponent } from './app.component';
import { MSLineChartComponent } from './ms-line-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    MSLineChartComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule
  ],
  providers: [ ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
