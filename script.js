'use strict';


//Implementing parent class
class Workout {
    date = new Date();
    id =  (Date.now() + '').slice(-10);
    clicks = 0

    constructor(coords, distance, duration){
        this.coords = coords; //array of coordinates (latitude and longitude) -> [lat,lng];
        this.distance = distance; // in km
        this.duration = duration; // in min
        
    };

    _setDescription(){
        // prettier-ignore -> Whenever we want to tell prettier extension to ignore the next line
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}${this.date.getDate()}`;
    }

    click(){
        this.clicks ++; // In each of the workouts we can increase the number of clicks;
    }
};

//Implementing child class - Running
class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription(); // It can't be added in the workout object (parent), Because only the child class contains the type that we need for this calculation
    };

    calcPace() {
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    } ;
};
//Implementing child class - Cycling
class Cycling extends Workout {
    type = 'cycling'; // It is the same as the one in comment from below.

    constructor(coords, distance, duration, elevationGain){
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        //this.type = 'cyling';
        this.calcSpeed();
        this._setDescription(); //It can't be added in the workout object (parent), Because only the child class contains the type that we need for this calculation
    };

    calcSpeed (){
        // km/h
        this.speed = this.distance/ (this.duration/60);
        return this.speed;
    };

};

//TEST DATA for Aabove sequences:
/*const run1 = new Running ([39,-12], 5.2, 24, 178 );
const cycling1 = new Cycling ([39,-12], 27, 95, 523 );
console.log(run1,cycling1);*/

//-----------------------------------------------------------------------------------------------------------
//APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];
    

    constructor(){
        //Get user's position:
        this._getPosition();

        //Get data from local storage:
        this._getLocalStorage();
        //Attach event handlers:
        
        //The form event listener is now declared in the global scope(must declare mapEvent and map also in the global scope)
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    };

    _getPosition(){
//GEOLOCATION API
    if(navigator.geolocation)
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
        alert('Could not get your position');
});
    };
    _loadMap(position){
            const {latitude} = position.coords;
            const{longitude} = position.coords;
            //console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
            
            const coords = [latitude,longitude];
        //-----------------------------------------------------------------------------------------
        //Displaying a MAP using LEAFLET library
        
            this.#map = L.map('map').setView(coords, this.#mapZoomLevel); // number 13 means the zoom in (the lower the number the more zoom out it is)
            //console.log(map);
            L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);
            
        //The below map object is an object generated by leaflet. This will be a special object 
        //with methods and properties on it.
        //map.on() replace .addEventLister() method
        ;
        //Handling clicks on map
        this.#map.on('click', this._showForm.bind(this));
            
         this.#workouts.forEach(work => {
            this._renderWorkout(work);
            this._renderWorkoutMarker(work);
           });

    };

    _showForm(mapE){
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    };

    _hideForm(){
        //Empty inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(()=> (form.style.display = 'grid'),1000);
    }

    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    };
    _newWorkout(e){

        e.preventDefault();

        const validInputs = (...inputs)=>inputs.every(inp=> Number.isFinite(inp)) //every method will return true if in all iterations, the result is true;

        const allPositive = (...inputs)=>inputs.every(inp=> inp > 0);

        

    //Get data from the form 
    const type = inputType.value; 
    const distance = +inputDistance.value; //This value come as a string => Is converted to Number
    const duration = +inputDuration.value; //This value come as a string => Is converted to Number
    const {lat, lng} = this.#mapEvent.latlng; //Create lat and long values based on the object;
    let workout;

     //If workout running => create running object;
    if(type === 'running'){
        const cadence = +inputCadence.value; //This value come as a string => Is converted to Number
        //Check if data is valid 
        //Check if each of them is a number, using a guard clause (checking the opposite of what we are actually interested in.
        // If that value is true, return immediately the function);
         if(
            //!Number.isFinite(distance) || 
            // !Number.isFinite(duration) || 
            // !Number.isFinite(cadence)
            !validInputs(distance, duration, cadence) || 
            !allPositive(distance,duration,cadence)
        ) 
            
            return alert ('Inputs have to be positive numbers!');

        workout = new Running([lat,lng], distance, duration, cadence)
        
    };

    //If workout cycling => create cycling object;

    if(type === 'cycling'){
        const elevation = +inputElevation.value; //This value come as a string => Is converted to Number
         if(
            !validInputs(distance, duration, elevation) ||
            !allPositive(distance, duration)
    ) 
        
           return alert ('Inputs have to be positive numbers!');

        workout = new Cycling ([lat,lng], distance, duration, elevation)
    } ;

    //Add new object to workout array
    this.#workouts.push(workout);
    //console.log(workout);

    //Render workout on map as a marker . //Display marker

    this._renderWorkoutMarker(workout);
    

    //Render workout on the list
    this._renderWorkout (workout);

    //Hide fporm + Clear input fields
    this._hideForm();

    //Set local storage to all workouts
    this._setLocalStorage()
 
    
    };

    _renderWorkoutMarker(workout){
    L.marker(workout.coords)
    .addTo(this.#map)
    .bindPopup(L.popup({
        maxWidth : 250, //pixels
        minWidth : 100, //pixels
        autoClose: false, //keep text on top of marker opened
        closeOnClick: false,
        className: `${workout.type}-popup`, //check css for class name
    }))
    .setPopupContent(`${workout.type === 'running' ? '?????????????' : '?????????????'} ${workout.description}`)
    .openPopup();
    }

    _renderWorkout(workout){
    
    //I need to do DOM manipulation. Create some html, and insert it into the DOM whenever there is an workout.
    //GENERATE HTML based on our code
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running'? '?????????????' : '?????????????'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">???</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

        if(workout.type === 'running')
        html += 
        ` <div class="workout__details">
        <span class="workout__icon">??????</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">????????</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>
        `;

        if(workout.type === 'cycling')
        html +=
        `<div class="workout__details">
        <span class="workout__icon">??????</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">???</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li> -->`;

 
    //inject all above html code into DOM:
 
        form.insertAdjacentHTML ('afterend', html);
    }

    _moveToPopup(e){
        const workoutEl = e.target.closest('.workout');
        //console.log(workoutEl);

        if(!workoutEl) return; //guard clause

        const workout = this.#workouts.find(
        work => work.id === workoutEl.dataset.id);
        console.log(workout);

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true, 
            pan: {
                duration: 1,
            },
        });

        //Taking the object workout and using that public interface

       // workout.click();

    }

//Local storage is a very simple API - It is only advised to be used for small amounts of data.
//Don't use local storage to store large amounts of data => Will slow down your application.
    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts)); //JSON.stringify(object) is a new method to convert object to a string
    }

    //This method will be executed right in the very beggining. At that point the workouts array will
    //always be empty.
    _getLocalStorage(){
       const data = JSON.parse(localStorage.getItem('workouts')); //JSON.parse(string) is converting the string back into an object .
       console.log(data);

       if(!data) return; //guard clause

       this.#workouts = data; 

       
    };

    //Remove stored data from the Local Storage: 
    reset(){
        localStorage.removeItem('workouts');
        location.reload(); //Ability to reload the page at location . Location is a very big object that contains lots of methods and properties in the browser.
    }
};

const app = new App (); //Write app.reset() in console directly to remove data from local storage.

    