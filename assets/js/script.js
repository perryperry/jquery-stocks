$(function () {
	window.location.hash = '#';
	// Globals variables 
	var products 	= []; // change back to nyse later... 
	var nasdaq 	= [];
	filters = {};

	//	Event handlers for frontend navigation
	//	Checkbox filtering
	var checkboxes = $('.all-products input[type=checkbox]');

	checkboxes.click(function () {

		var that = $(this),
			specName = that.attr('name');

		// When a checkbox is checked we need to write that in the filters object;
		if(that.is(":checked")) {

			// If the filter for this specification isn't created yet - do it.
			if(!(filters[specName] && filters[specName].length)){
				filters[specName] = [];
			}

			//	Push values into the chosen filter array
			filters[specName].push(that.val());

			// Change the url hash;
			createQueryHash(filters);

		}

		// When a checkbox is unchecked we need to remove its value from the filters object.
		if(!that.is(":checked")) {

			if(filters[specName] && filters[specName].length && (filters[specName].indexOf(that.val()) != -1)){

				// Find the checkbox value in the corresponding array inside the filters object.
				var index = filters[specName].indexOf(that.val());

				// Remove it.
				filters[specName].splice(index, 1);

				// If it was the last remaining value for this specification,
				// delete the whole array.
				if(!filters[specName].length){
					delete filters[specName];
				}

			}

			// Change the url hash;
			createQueryHash(filters);
		}
	});

	// When the "Clear all filters" button is pressed change the hash to '#' (go to the home page)
	$('.filters button').click(function (e) {
		e.preventDefault();
		window.location.hash = '#';
	});

	// Single product page buttons

	var singleProductPage = $('.single-product');

	singleProductPage.on('click', function (e) {

		if (singleProductPage.hasClass('visible')) {

			var clicked = $(e.target);

			// If the close button or the background are clicked go to the previous page.
			if (clicked.hasClass('close') || clicked.hasClass('overlay')) {
				// Change the url hash with the last used filters.
				createQueryHash(filters);
			}

		}

	});

	$.getJSON("nyse.json", function( data ) {
		// Write the data into our global variable.
		products = data;

		// Call a function to create HTML for all the products.
		generateAllProductsHTML(products);


		// Call a function to create HTML for all the products.
		$.each(products, function( index, value ) {
		  // console.log(index + ": " + value.Symbol );
		   $('#nyse-select').append($('<option>', { 
		        value: value.Symbol,
		        text : value.Name + ' (' + value.Symbol + ')'
		    }));
		});

		$('#nyse-select').change(function(){
			var symbol = $(this).val();
			getStock('NYSE', symbol);
		});
	});

	$.getJSON("nasdaq.json", function( data ) {
		// Write the data into our global variable.
		nasdaq = data;
		// Call a function to create HTML for all the products.
		//generateAllProductsHTML(products);
		$.each(nasdaq, function( index, value ) {
		  // console.log(index + ": " + value.Symbol );
		   $('#nasdaq-select').append($('<option>', { 
		        value: value.Symbol,
		        text : value.Name + ' (' + value.Symbol + ')'
		    }));
		});
		
		$('#nasdaq-select').change(function(){
			var symbol = $(this).val();
			getStock('NASDAQ', symbol);
		});
	});

	// Manually trigger a hashchange to start the app.
	$(window).trigger('hashchange');

	// An event handler with calls the render function on every hashchange.
	// The render function will show the appropriate content of out page.
	$(window).on('hashchange', function(){
		render(decodeURI(window.location.hash));
	});

	// Navigation

	function render(url) {

		// Get the keyword from the url.
		var temp = url.split('/')[0];

		// Hide whatever page is currently shown.
		$('.main-content .page').removeClass('visible');


		var	map = {

			// The "Homepage".
			'': function() {

				// Clear the filters object, uncheck all checkboxes, show all the products
				filters = {};
				checkboxes.prop('checked',false);

				renderProductsPage(products);
			},

			// Single Products page.
			'#product': function() {

				// Get the index of which product we want to show and call the appropriate function.
				var index = url.split('#product/')[1].trim();

				renderSingleProductPage(index, products);
			},

			// Page with filtered products
			'#filter': function() {

				// Grab the string after the '#filter/' keyword. Call the filtering function.
				url = url.split('#filter/')[1].trim();

				// Try and parse the filters object from the query string.
				try {
					filters = JSON.parse(url);
				}
					// If it isn't a valid json, go back to homepage ( the rest of the code won't be executed ).
				catch(err) {
					window.location.hash = '#';
					return;
				}

				renderFilterResults(filters, products);
			}

		};

		// Execute the needed function depending on the url keyword (stored in temp).
		if(map[temp]){
			map[temp]();
		}
		// If the keyword isn't listed in the above - render the error page.
		else {
			renderErrorPage();
		}

	}

	// This function is called only once - on page load.
	// It fills up the products list via a handlebars template.
	// It recieves one parameter - the data we took from products.json.
	function generateAllProductsHTML(data){

		var list = $('.all-products .products-list');

		var theTemplateScript = $("#products-template").html();
		//Compile the template​
		var theTemplate = Handlebars.compile (theTemplateScript);
		list.append (theTemplate(data));


		// Each products has a data-index attribute.
		// On click change the url hash to open up a preview for this product only.
		// Remember: every hashchange triggers the render function.
		list.find('li').on('click', function (e) {
			e.preventDefault();

			var productIndex = $(this).data('index');

			window.location.hash = 'product/' + productIndex;
		})
	}

	// This function receives an object containing all the product we want to show.
	function renderProductsPage(data){

		var page = $('.all-products'),
			allProducts = $('.all-products .products-list > li');

		// Hide all the products in the products list.
		allProducts.addClass('hidden');

		// Iterate over all of the products.
		// If their ID is somewhere in the data object remove the hidden class to reveal them.
		allProducts.each(function () {

			var that = $(this);

			data.forEach(function (item) {
				if(that.data('index') == item.id){
					that.removeClass('hidden');
				}
			});
		});

		// Show the page itself.
		// (the render function hides all pages so we need to show the one we want).
		page.addClass('visible');

	}


	// Opens up a preview for one of the products.
	// Its parameters are an index from the hash and the products object.
	function renderSingleProductPage(index, data){

		var page = $('.single-product'),
			container = $('.preview-large');

		// Find the wanted product by iterating the data object and searching for the chosen index.
		if(data.length){
			data.forEach(function (item) {
				if(item.id == index){

					console.log("Symbol: " + item.Symbol);

					var exchangeIndex = 'NYSE';

					$.get( "http://finance.google.com/finance/info?client=ig&q=" + exchangeIndex + "%3A" + item.Symbol, function(data) {
		
						})
						  .done(function(data) {
						   	var stocks = data;
							stocks = stocks.trim();
							stocks = stocks.replace(/^\/|\/$/g, '');
							stocks = stocks.replace(/^\/|\/$/g, '');
							stocks = stocks.trim();

							var jsonStocks = JSON.parse(stocks);
						  	console.log(jsonStocks);

						  	var listing = jsonStocks[0].l;
						  	var priceChange = parseFloat(jsonStocks[0].c);
						  	var addCSS 		= (priceChange > 0) ? 'gain' : 'loss';
				  			var removeCSS 	= (priceChange > 0) ? 'loss' : 'gain';

						  	priceChange = (priceChange > 0) ? '+ $' + priceChange : '- $' + jsonStocks[0].c.replace('-', '');
						  	console.log(priceChange);

						  	// https://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-money-in-javascript
						  	// The new ECMAScript Internationalization API offers a numberformat function.

						  	var formatter = new Intl.NumberFormat('en-US', {
											  style: 'currency',
											  currency: 'USD',
											  minimumFractionDigits: 2,
											});

						  	// placing the update of the individual stock profile inside the async get, to avoid issues

						  	// Populate '.preview-large' with the chosen product's data.
							container.find('h3').text(item.Name);
							container.find('a').attr('href', item.SummaryQuote);
							container.find('span:nth-of-type(2)').text(item.Symbol);
							container.find('span:nth-of-type(4)').text(item.Sector);
							container.find('span:nth-of-type(6)').text(item.industry);
							container.find('span:nth-of-type(8)').text(item.IPOyear);			// initial IPO
							container.find('span:nth-of-type(10)').text('$' + jsonStocks[0].l); // current listing price
							container.find('span:nth-of-type(12)').text(priceChange);	
							container.find('span:nth-of-type(14)').text(jsonStocks[0].cp + '%');		// percentage change	

							// change css to display green for gains, red for loss
							container.find('span:nth-of-type(12)').addClass(addCSS);
							container.find('span:nth-of-type(12)').removeClass(removeCSS);
							container.find('span:nth-of-type(14)').addClass(addCSS);
							container.find('span:nth-of-type(14)').removeClass(removeCSS);


						  })
						  .fail(function() {
						    alert( "error" );
						  })
						  .always(function() {
						    console.log( "get request finished" );
						  });

				}
			});
		}

		// Show the page.
		page.addClass('visible');

	}


	// Find and render the filtered data results. Arguments are:
	// filters - our global variable - the object with arrays about what we are searching for.
	// products - an object with the full products list (from product.json).
	function renderFilterResults(filters, products){

			// This array contains all the possible filter criteria.
		var criteria = ['Sector'],
			results = [],
			isFiltered = false;

		// Uncheck all the checkboxes.
		// We will be checking them again one by one.
		checkboxes.prop('checked', false);


		criteria.forEach(function (c) {

			// Check if each of the possible filter criteria is actually in the filters object.
			if(filters[c] && filters[c].length){


				// After we've filtered the products once, we want to keep filtering them.
				// That's why we make the object we search in (products) to equal the one with the results.
				// Then the results array is cleared, so it can be filled with the newly filtered data.
				if(isFiltered){
					products = results;
					results = [];
				}


				// In these nested 'for loops' we will iterate over the filters and the products
				// and check if they contain the same values (the ones we are filtering by).

				// Iterate over the entries inside filters.criteria (remember each criteria contains an array).
				filters[c].forEach(function (filter) {

					// Iterate over the products.
					products.forEach(function (item){

						// If the product has the same specification value as the one in the filter
						// push it inside the results array and mark the isFiltered flag true.

						// if(typeof item.specs[c] == 'number'){
						// 	if(item.specs[c] == filter){
						// 		results.push(item);
						// 		isFiltered = true;
						// 	}
						// }

						if(typeof item.Sector == 'string'){
							if(item.Sector.replace(' ', '').indexOf(filter) != -1){
								results.push(item);
								isFiltered = true;
							}
						}

					});

					// Here we can make the checkboxes representing the filters true,
					// keeping the app up to date.
					if(c && filter){
						$('input[name='+c+'][value='+filter+']').prop('checked',true);
					}
				});
			}

		});

		// Call the renderProductsPage.
		// As it's argument give the object with filtered products.
		renderProductsPage(results);
	}


	// Shows the error page.
	function renderErrorPage(){
		var page = $('.error');
		page.addClass('visible');
	}

	// Get the filters object, turn it into a string and write it into the hash.
	function createQueryHash(filters){

		// Here we check if filters isn't empty.
		if(!$.isEmptyObject(filters)){
			// Stringify the object via JSON.stringify and write it after the '#filter' keyword.
			window.location.hash = '#filter/' + JSON.stringify(filters);
		}
		else{
			// If it's empty change the hash to '#' (the homepage).
			window.location.hash = '#';
		}

	}
}); // end of document is ready