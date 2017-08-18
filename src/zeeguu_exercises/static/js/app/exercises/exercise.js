/** Modular Zeeguu Powered Exercise @author Martin Avagyan
 *  @initialize it using: new Exercise();
 *  @customize it by using prototypal inheritance
 **/

import $ from 'jquery';
import events from '../pubsub';
import Util from '../util';
import Settings from '../settings';
import Session from '../session';
import {Loader} from '../loader';
import ShakeAnimation from "../animations/shake_animation";
import Feedback from "../feedback";
import Speaker from "../speaker";

var Exercise = function (data, index, size) {
	this.init(data, index, size);
	//TODO unbind method
};

Exercise.prototype = {

	/************************** SETTINGS ********************************/
	data: 0,
	customTemplateURL: 0,
	index: 0,
	startIndex: 0,
	size: 0, //default number of bookmarks
	description: "Solve the exercise",  //default description
	session: Session.getSession(), //Example of session id 34563456 or 11010001
	lang:    '',	//user language
	startTime: 0,
	isHintUsed: false,
	minRequirement: 1,
	resultSubmitSource: Settings.ZEEGUU_EX_SOURCE_RECOGNIZE,//Defualt submission
	successAnimationTime: 2000,
	exFeedback: 0,
	instanceCorrect: false,

	/*********************** General Functions ***************************/
	/**
	 *    Loads the HTML exercise template from static
	 **/

	createCustomDom: function () {
		Loader.loadTemplateIntoElem(this.customTemplateURL, $("#custom-content"));
	},

	/**
	*	Saves the common dom in chache
	**/
	cacheDom: function(){
		this.$elem 				= $("#ex-module");
		this.$description  		= this.$elem.find("#ex-descript");
		this.$loader 			= this.$elem.find('#loader');
		this.$statusContainer 	= this.$elem.find('#ex-status-container');
		this.$exFooterPrimary 	= this.$elem.find('#ex-footer-primary');
		this.$exFooterSecondary = this.$elem.find('#ex-footer-secondary');
		this.$deleteBtn			= this.$elem.find('#btn-delete');
		this.$reportBtn			= this.$elem.find('#btn-report');
		this.$speakBtn			= this.$elem.find('#btn-speak');
		this.$sourceBtn			= this.$elem.find('#btn-source');
		this.cacheCustomDom();
	},

	/**
	 *    Exercise initialaizer
	 **/
	init: function (data, index, size) {
		var _this = this;
		$.when(Loader.loadTemplateIntoElem(_this.customTemplateURL, $("#custom-content"))).done(function () {
			_this.cacheDom();
			_this.generalBindUIActions();
			_this._constructor(data, index, size);
		});
	},


	/**
	 *    The main constructor
	 **/
	_constructor: function (data, index, size) {
		this.data = data;
		this.index = index;
		this.startIndex = index;
		this.size = size;
		this.shake = new ShakeAnimation();
		this.exFeedback = new Feedback(this.resultSubmitSource,this.session);
        Session.getLanguage((text)=>{this.lang = text});//Set the language with callback
		this.setDescription();
		this.next();
		this.startTime = Date.now();
	},

	/**
	 *    Populates custom exercise description
	 **/
	setDescription: function () {
		this.$description.html(this.description);
	},

	/**
	 *    When the ex are done, notify the observers
	 **/
	onExComplete: function () {
		events.emit('exerciseCompleted');
	},

	/**
	 *    Check selected answer with success condition
	 **/
	checkAnswer: function (chosenWord) {
		if (this.successCondition(chosenWord)) {
			this.onSuccess();
			return;
		}
		this.wrongAnswerAnimation();
		this.submitResult(this.data[this.index].id, Settings.ZEEGUU_EX_OUTCOME_WRONG);
	},

	/**
	 *    Actions taken when the succes condition is true
	 **/
	onSuccess: function () {
		this.$exFooterPrimary.removeClass('mask-appear');
		this.$exFooterSecondary.toggleClass('mask-appear');
		this.handleSuccessCondition();
	},

	/**
	 * Revert the secondary and primary footers
	 * */
	revertPrimary: function () {
		this.$exFooterSecondary.removeClass('mask-appear');
		this.$exFooterPrimary.toggleClass('mask-appear');
	},

	/**
	 * When the answer is successful show the animation and submit the result
	 * */
	handleSuccessCondition: function () {
		this.animateSuccess();
		//Submit the result of translation
		this.submitResult(this.data[this.index].id, Settings.ZEEGUU_EX_OUTCOME_CORRECT);
		this.setInstanceState(true);//Turn on the instance, instance was correctly solved
	},



	/**
	 * On success condition true, generate new exercise
	 * */
	onRenderNextEx: function () {
		this.index++;
		this.setInstanceState(false);//Turn off the instance, instance reset to false
		// Notify the observer
		events.emit('progress');
		this.revertPrimary();
		// The current exercise set is complete
		if (this.index == this.size + this.startIndex) {
			this.onExComplete();
			return;
		}
		this.next();
		this.startTime = Date.now();
	},

	/**
	 * Instance switch, changes the instance
	 * @return {void}
	 * */
	setInstanceState: function (state) {
		this.instanceCorrect = state;
	},

	/**
	 * Instance switch, changes the instance
	 * @return {boolean}
	 * */
	getInstanceState: function () {
		return this.instanceCorrect;
	},

	/**
	 *    Request the submit to the Zeeguu API
	 *  e.g. https://www.zeeguu.unibe.ch/api/report_exercise_outcome/Correct/Recognize/1000/4726?session=34563456
	 **/
	submitResult: function (id, exOutcome) {
		let _this = this;
		//If the user used the hint, do not register correct solution, resent the hint, move on
		if (this.isHintUsed && exOutcome == Settings.ZEEGUU_EX_OUTCOME_CORRECT) {
			this.isHintUsed = false;
			return;
		}
		//If hint is used twice, ignore request
		if (this.isHintUsed && exOutcome == Settings.ZEEGUU_EX_OUTCOME_HINT) return;
		//Calculate time taken for single exercise
		var exTime = Util.calcTimeInMilliseconds(this.startTime);
		//Request back to the server with the outcome
		//console.log(Settings.ZEEGUU_API + Settings.ZEEGUU_EX_OUTCOME_ENDPOINT + exOutcome +  _this.resultSubmitSource + "/" + exTime + "/" + id + "?session="+this.session);
		$.post(Settings.ZEEGUU_API + Settings.ZEEGUU_EX_OUTCOME_ENDPOINT + exOutcome + _this.resultSubmitSource + "/" + exTime + "/" + id + "?session=" + this.session);
	},

	/**
	 * Function for deleting bookmark from Zeeguu
	 * @example https://zeeguu.unibe.ch/api/delete_bookmark/19971?session=34563456
	 * */
	deleteBookmark: function (idx) {
		$.post(Settings.ZEEGUU_API + Settings.ZEEGUU_DELETE_BOOKMARKS + "/" + this.data[idx].id + "?session=" + this.session);
		this.onRenderNextEx();
	},

	/**
	 * Function to open the source in a new tab
	 * */
    giveSource: function (idx) {
    	let url = this.data[idx].url;
        let win = window.open(url, '_blank');
        win.focus();
    },

	/**
	 *    Removes focus of page elements
	 **/
	prepareDocument: function () {
		if (document.activeElement != document.body) document.activeElement.blur();
	},

	/**
	 *    User hint handler
	 **/
	handleHint: function () {
		this.submitResult(this.data[this.index].id, Settings.ZEEGUU_EX_OUTCOME_HINT);
		this.isHintUsed = true;

		this.giveHint();
	},

	/**
	 * Function for sending the user feedback for an individual exercise
	 * */
	giveFeedbackBox: function (idx) {
		this.exFeedback.exerciseFeedbackBox(this.data[idx].id);
	},


	/**
	 * Apply style dynamically when content changes
	 * */
	reStyleDom: function () {
		this.reStyleContext();
	},

	/**
	 * Apply style dynamically to context
	 * */
	reStyleContext: function () {
		if(!Util.isMultiline(this.$context)){
			this.$context.addClass('centering');//Text align center
			return;
		}
		this.$context.removeClass('centering');//Text align justify
	},

	/**
	 * Function responsible for text to speech
	 * */
	handleSpeak: function () {
		let speakerObj = this.objectForSpeaker();
		Speaker.speak(speakerObj.text,speakerObj.language);
	},

	/**
	 * Binding of general actions for every exercise
	 * */
	generalBindUIActions: function () {
		//Bind general actions
		this.$deleteBtn.click(() => {this.deleteBookmark(this.index);});
		this.$reportBtn.click(() => {this.giveFeedbackBox(this.index);});
        this.$sourceBtn.click(() => {this.giveSource(this.index);});
		this.$speakBtn.click(() => {this.handleSpeak();});

		//Bind custom actions for each exercise
		this.bindUIActions();
	},

	/**
	 * Unbinding of general actions for every exercise
	 * */
	generalUnBindUIActions: function () {
		this.$deleteBtn.off( "click");
		this.$reportBtn.off( "click");
		this.$speakBtn.off( "click");
        this.$sourceBtn.off( "click");
		//TODO terminate individual bindings for each exercise,
		//TODO for that implement terminate method for each
	},

	/**
	 * Exercise termination
	 * */
	terminateExercise: function () {
		this.generalUnBindUIActions();
	},

	/**
	 * Text for speaker
	 * @return {Object}, the text to be spoken and the language, @example: {text: animatiefilm, language: "nl"}
	**/
	objectForSpeaker: function(){
		return {text: this.data[this.index].from, language: this.data[this.index].from_lang};
	},

	/*********************** Interface functions *****************************/
	/**
	*	Binding UI with Controller functions
	**/
	bindUIActions: function(){},
	
	/**
	*	Condition used by checkAnswer 
	*	If true, then a correct answer was given
	**/
	successCondition: function(){},
	
	
	/**
	*	Gives a hint when the hint button is pressed
	**/
	giveHint: function (){},
	
	/**
	*	Populates the next exercise
	**/
	next: function (){},
	
	/**
	*	Cahes custom dom of the exercise
	**/
	cacheCustomDom: function(){},

	/**
	*	Animation for wrong solution
	**/
	wrongAnswerAnimation: function(){},

	/************************** Animations ********************************/	

	/**
	*	Animation for successful solution
	**/
	animateSuccess: function(){
		let _this = this;
		this.$statusContainer.removeClass('hide');
		setTimeout(function(){
			if (_this.$statusContainer.length > 0) {
				_this.$statusContainer.addClass('hide');
			}
		}, _this.successAnimationTime);
	},	
};

export default Exercise;