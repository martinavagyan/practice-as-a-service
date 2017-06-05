/**
 * Starter module, inherits from Home
 * */
import $ from 'jquery';
import Home from './home';

function Starter(){
	this.init();

	/** @Override */
	this.cacheDom =  function(){
		this.$elem 			= $("#starter-body");
		this.$exCards 		= this.$elem.find("#exercieses-cards");
		this.$attribution 	= this.$elem.find("#attribution");
		this.$credits 		= this.$elem.find("#credits");
	}
}

Starter.prototype = Object.create(Home.prototype, {
	constructor: Starter,
	/************************** SETTINGS ********************************/
	screenTemplateURL: {value:  'static/template/starter/starter.html'},
	cardTemplateURL: {value: 'static/template/starter/plan_card.html'},
	currentInvocation: {value: 'starterScreenRestart'},
	exNames: {
		value: [
			{
				name: "Basic",
				exID: [[1, 2], [4, 2], [2, 2], [3, 1], [2, 1],[4, 2]],
				info: 'You can practice about 10 words.',
				icon: 'static/img/icons/starter/pinwheel.svg',
				gradientColor: 'starter-btn-header-level1',
				time: 1
			},
			{
				name: "Casual",
				exID: [[4, 2], [2, 2], [3, 1], [1, 3], [2, 2],[1, 2],[3, 1],[2, 1],[3, 1]],
				info: 'You can practice about 15 words.',
				icon: 'static/img/icons/starter/apple.svg',
				gradientColor: 'starter-btn-header-level2',
				time: 2
			},
			{
				name: "Regular",
				exID: [[1, 2], [2, 2], [3, 1], [4, 3], [2, 2],[1, 3],[3, 1],[1, 3],[3, 1],[4, 2],[2, 2],[1, 2],[3,1]],
				info: 'You can practice about 25 words.',
				icon: 'static/img/icons/starter/diamond.svg',
				gradientColor: 'starter-btn-header-level3',
				time: 3
			},
		]
	},
});

export default Starter;