import express from 'express';
import chalk from 'chalk';
import  Debug from 'debug';
import morgan from 'morgan';
import path from 'path';
import bodyParser from 'body-parser';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import  multer from "multer";
import {join} from 'path';
import cors from 'cors'
import  fs from 'fs'
import  Loki from 'lokijs'
import { loadCollection, imageFilter, cleanFolder } from './utils';

const app = express();
const debug= Debug("App");
const port: string =( process.env.PORT || 3000) as string;
app.use(morgan('tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: 'library' }));
app.use(cors());
// optional: clean all data before start
// cleanFolder(UPLOAD_PATH);

// require('../config/passport.js')(app);

app.use(express.static(path.join(__dirname, '/assets/')));
const DIST_FOLDER = join(process.cwd(), 'dist');
app.get('*.*', express.static( DIST_FOLDER, {
  maxAge: '1y'
}));
console.log("hello");


// app.use('/css', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/css')));
// app.use('/js', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/js')));
// app.use('/js', express.static(path.join(__dirname, '/node_modules/jquery/dist')));
// app.set('views', './src/views');
// app.set('view engine', 'ejs');

const nav = [
  { link: '/books', title: 'Book' },
  { link: '/authors', title: 'Author' }
];

const DB_NAME = 'db.json';
const COLLECTION_NAME = 'images';
const UPLOAD_PATH = 'uploads';
const upload = multer({ dest: `${UPLOAD_PATH}/` });  //, fileFilter: imageFilter
const db = new Loki(`${UPLOAD_PATH}/${DB_NAME}`, { persistenceMethod: 'fs' });

const Storage = multer.diskStorage({
  destination: function(req, file, callback) {
      callback(null, DIST_FOLDER);
  },
  filename: function(req, file, callback) {
    debug(chalk.green(file+""))
      callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  }
});

const uploadmul = multer({
  storage: Storage
}).array("temp", 3)


// const bookRouter = require('./src/routes/bookRoutes')(nav);
// const adminRouter = require('./src/routes/adminRoutes')(nav);
// const authRouter = require('./src/routes/authRoutes')(nav);

// app.use('/books', bookRouter);
// app.use('/admin', adminRouter);
// app.use('/auth', authRouter);

// app.get('/', (req, res) => {
//   res.render(
//     'index',
//     {
//       nav: [{ link: '/books', title: 'Books' },
//       { link: '/authors', title: 'Authors' }],
//       title: 'Library'
//     }
//   );
// });
app.get("/", function(req, res) {
  // res.send(path.join( __dirname , "index.html"));
      console.log(
      chalk.red(DIST_FOLDER)
    );

    res.sendFile(path.join(DIST_FOLDER, 'index.html'));
  });
app.post("/api/Upload", function(req, res) {
  console.log(req.file, req.files);

  debug(chalk.green(req.file+""))

  uploadmul(req, res, function(err) {
      if (err) {
          return res.end("Something went wrong!"+ err);
      }
      return res.end("File uploaded sucessfully!.");
  });
});


app.post('/api/profile', upload.single('avatar'), async (req, res) => {
  try {
      const col = await loadCollection(COLLECTION_NAME, db);
      const data = col.insert(req.file);

      db.saveDatabase();
      res.send({ id: data.$loki, fileName: data.filename, originalName: data.originalname });
  } catch (err) {
      res.sendStatus(400);
  }
})

app.post('/api/photos/upload', upload.array('photos', 12), async (req, res) => {
  try {
      const col = await loadCollection(COLLECTION_NAME, db)
      let data = [].concat(col.insert(req.files));

      db.saveDatabase();
      res.send(data.map((x: any) => ({ id: x.$loki, fileName: x.filename, originalName: x.originalname })));
  } catch (err) {
      res.sendStatus(400);
  }
})

app.get('/images', async (req, res) => {
  try {
      const col = await loadCollection(COLLECTION_NAME, db);
      res.send(col.data);
  } catch (err) {
      res.sendStatus(400);
  }
})

app.get('/api/images/:id', async (req, res) => {
  try {
      const col = await loadCollection(COLLECTION_NAME, db);
      const result = col.get(+req.params.id);

      if (!result) {
          res.sendStatus(404);
          return;
      };

      res.setHeader('Content-Type', result.mimetype);
      fs.createReadStream(path.join(UPLOAD_PATH, result.filename)).pipe(res);
  } catch (err) {
      res.sendStatus(400);
  }
})

app.listen(port, () => {
  debug(`listening on port ${chalk.green(port)}`);
});




