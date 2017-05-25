$(function () {
	// Globals variables 
	var nyse 	= [];
	var nasdaq 	= [];

	$.getJSON("nyse.json", function( data ) {
		// Write the data into our global variable.
		nyse = data;
		// Call a function to create HTML for all the products.
		//generateAllProductsHTML(products);

		// Manually trigger a hashchange to start the app.
		//$(window).trigger('hashchange');

		$.each(nyse, function( index, value ) {
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

		// Manually trigger a hashchange to start the app.
		//$(window).trigger('hashchange');

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

});