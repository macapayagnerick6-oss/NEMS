import {

  AngularNodeAppEngine,

  createNodeRequestHandler,

  isMainModule,

  writeResponseToNodeResponse,

} from '@angular/ssr/node';

import express from 'express';

import { join } from 'node:path';



import {

  handleGeocode,

  handleReverseGeocode,

  handleWeather,

  handleWeatherGrid,

} from './server/weather-api';



const browserDistFolder = join(import.meta.dirname, '../browser');



const app = express();

const angularApp = new AngularNodeAppEngine();



app.get('/api/geocode', (req, res) => {

  void handleGeocode(req, res);

});



app.get('/api/reverse-geocode', (req, res) => {

  void handleReverseGeocode(req, res);

});



app.get('/api/weather/grid', (req, res) => {

  void handleWeatherGrid(req, res);

});



app.get('/api/weather', (req, res) => {

  void handleWeather(req, res);

});



app.use(

  express.static(browserDistFolder, {

    maxAge: '1y',

    index: false,

    redirect: false,

  }),

);



app.use((req, res, next) => {

  angularApp

    .handle(req)

    .then((response) =>

      response ? writeResponseToNodeResponse(response, res) : next(),

    )

    .catch(next);

});



if (isMainModule(import.meta.url) || process.env['pm_id']) {

  const port = process.env['PORT'] || 4000;

  app.listen(port, (error) => {

    if (error) {

      throw error;

    }



    console.log(`Node Express server listening on http://localhost:${port}`);

  });

}



export const reqHandler = createNodeRequestHandler(app);

