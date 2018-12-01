# ASE Multimedia Project - Video Player
## How to run this project 
1. Clone this repo: ` git clone https://github.com/codepadawan93/ase-multimedia-project.git`
2. Install dependecies: ` npm install`
3. Run the server: ` npm start ` 
4. Add your files to `./media/movies`. Add paths to `./media/metadata/metadata.json`
4. Navigate to [http://localhost:8080](http://localhost:8080) and view your movies!
## General requirements

The project will be archived using the zip format. The name of the archive should follow the following pattern ``` TopicCode_GroupNumber_LASTNAME_FirstName.zip.```

Inside the archive you should have the following structure:
* lib: director care conține codul preluat din alte surse (curs, seminarii, biblioteci sau fragmente de cod preluate de pe internet, etc);
* media: director care conține elementele media utilizate în cadrul proiectului (imagini, sunete, video, fișiere de date);
* ```CodTema_NrGrupa_NUME_Prenume.html```: fișier care conține codul HTML aferent proiectului;
* ```CodTema_NrGrupa_NUME_Prenume.css```: fișier care conține codul CSS aferent proiectului;
* ```CodTema_NrGrupa_NUME_Prenume.js```: fișier care conține codul JavaScript aferent proiectului.

### Observații pentru fișierele CodTema_NrGrupa_NUME_Prenume.html/css/js:
* trebuie să conțină doar cod sursă formatat și comentat;
* sunt singurele care intră în evaluarea proiectului;
* sunt puntate doar în măsura în care studentul dovedește la evaluare cunoașterea elementelor utilizate;
* nu este permis cod preluat din nici o altă sursă (exemple curs / seminar, colegi, internet, etc.); orice fragment de cod preluat din alte surse se consideră tentativă de fraudă; se verifică automat.

### Project evaluation
* 1p - [x] Develop the application using HTML5, CSS3 and JavaScript
* 3p - [ ] Develop the application as a Progressive Web Application1 using HTML5, CSS3 and JavaScript (the application should work offline, users should be able to install it on their computers using Google Chrome2).
* 1p - [x] Responsive design implemented using CSS Media Queries3 or Bootstrap4
* 1p - [x] Using one of the following APIs: *Web Storage API5*, IndexedDB6, WebXR7, (suggest other APIs that you find interesting for your project by sending an email at liviu.cotfas@ase.ro )
* 4p - [x] Implement requirements specific to your project topic

## Video Player
### Description: 
Build a video player that allows the user to view the videos in a playlist containing at least 4 videos (statically stored in the application)

### Requirements (4p):
* 1p - [x] posibilitate navigare prin playlist; trecere automată la filmul următor
* 1p - [ ] aplicare de efecte video (selectabile de către utilizator)
* 2p - [x] desenare controale (previous, play / pause, next, progress bar) pe canvas
* 1p - [x] desenare histogramă în timp real pentru video
* 1p - [x] salvare cadru curent
* 1p - [ ] afișare subtitrări (stocate sub formă de fișiere JSON în cadrul aplicației)

## Author
- Kovacs Erik-Robert
