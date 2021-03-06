/* 
	TO DO: 
	
	1. Pulire il codice 
	
 */

$(function () {

	/* MOUSE WHEEL SCROLL */
	// [0] per utilizzare attachEvent JS (che non funzione su di un wrapper $ JQuery)
	const movie = $('#movie-list')[0];
	const tv = $('#tv-list')[0];
	scroll(movie);
	scroll(tv);
	/* END MOUSE WHEEL SCROLL */

	// focus sull'input
	$('#input').focus();

	// svuoto il campo input
	$("#input").val('');

	// nascondo il filter button fino al caricamento del DOM
	$('#filter-btn').hide();

	// attivazione con INVIO o CLICK SU ICONA avvio findCollection per le chiamate AJAX
	$('#input').keydown(function (e) {
		if (e.which == 13 && e.keyCode == 13 && $('#input').val()) {
			// se premo invio fermo l'auto scroll
			clearInterval((stopScroll1));
			findCollection();
		}
	});
	$("#search-btn").click(searchBtn);


	// bottoni per lo scroll
	$('#list').on('click', '.scroll', scrollButtonMovie);

	// 	acquisizione e popolazione DOM ultime uscite movie
	ajaxUpcomingMovie('movie');
	// creo pulsanti scroll orizzontale
	createScrollButtons('movie');


	// pulsante filter acquisisco generi dal DOM, reduce dell'array generi e popolazione dropdown
	$('#filter').on('click', '#filter-btn', function () {
		genreDom();
		// apertura dropdown con click su filter-btn
		$(this).next().slideToggle(350);
	});

	// chiusura dropdown con mouseleave
	$('#filter-dropdown').mouseleave(function () {
		$(this).slideUp(350);
	})

	// click elemento dropdown -> show generi corrispondenti
	$('#filter-dropdown').on('click', 'li', showGenre);


	/* FUNZIONE CHE FA AUTOSCROLL */
	stopScroll1 = setInterval(() => {
		$('#movie-list')[0].scrollLeft += (270);
	}, 5000);
	/* END AUTOSCROLL */

	
	
});


/* ******** */
/* FUNZIONI */
/* ******** */

// pulsante ricerca 
function searchBtn() {
	if ($('#input').val()) {
		// se premo search fermo l'auto scroll
		clearInterval((stopScroll1));

		findCollection();
		$('#input').focus();
	}
};

// chiamata AJAX per restituire la stringa
function findCollection() {
	// salvo in una variabile il campo preso da #input
	let query = saveAndReset();
	// chiamate AJAX
	ajaxCall(query, 'movie');
	ajaxCall(query, 'tv');
}

// resetto il DOM, SALVO valore di input e svuoto input 
function saveAndReset() {
	$('#tv-list').empty();
	$('#movie-list').empty();
	$('#filter-btn').text('Filtra per genere');
	createScrollButtons('movie');
	createScrollButtons('tv');
	let value = $("#input").val();
	$("#input").val('');
	return value
}

// chiamata AJAX novità film
function ajaxUpcomingMovie(type) {


	// TESTO ULTIME USCITE

	$('#tv-list').append(`<h2 class='upcoming'>I titoli del momento</h2>`);


	$.ajax({
		method: 'GET',
		url: `https://api.themoviedb.org/3/${type}/upcoming`,
		data: {
			api_key: '5735ba8aa714f2161c6a9f7f267223ef',
			language: 'it-IT'

		},
		success: function (obj) {
			// se ci sono risultati
			if (obj.total_results > 0) {
				// stampo la collezione a video in base al tipo
				printCollection(obj, type);
			} else {
				noResult(type);
			}
		},
		error: function () {
			alert('Errore');
		}
	});
}

// chiamata AJAX principale per ritornare i valori di ogni item
function ajaxCall(str, type) {
	$.ajax({
		method: 'GET',
		url: `https://api.themoviedb.org/3/search/${type}`,
		data: {
			api_key: '5735ba8aa714f2161c6a9f7f267223ef',
			language: 'it-IT',
			query: str,
		},
		success: function (obj) {
			// se ci sono risultati
			if (obj.total_results > 0) {
				// stampo la collezione a video in base al tipo
				printCollection(obj, type);
			} else {
				noResult(type);
			}
		},
		error: function () {
			alert('Errore');
		}
	});
}


// stampa collezione in base alla query inserita in input
function printCollection(data, type) {
	// template HB
	var source = $("#entry-template").html();
	var template = Handlebars.compile(source);
	for (let i = 0; i < data.results.length; i++) {
		let thisItem = data.results[i];
		let location;
		type == 'movie' ? location = $('#movie-list') : location = $('#tv-list')
		let hbObj = {
			// id per definire un data id dell'elemento corrente
			idMovie: thisItem.id,
			title: thisItem.title || thisItem.name,
			original_title: thisItem.original_title || thisItem.original_name,
			original_language: langFlags(thisItem.original_language),
			vote_average: star(thisItem.vote_average),
			tipo: checkType(type),
			poster: checkImage(thisItem.poster_path),
			overview: thisItem.overview.substring(0, 250) + '[...]',
		}
		var html = template(hbObj);
		location.append(html);

		/* Chiamata AJAX per ricercare i generi del film corrente */
		// check del genere -  NO RETURN FUNCTION (AJAX call)
		// cerco per genere passando: 1 il tipo (differenzio url in cui cercare), 2 l'id del genere (posso averne più di uno), 3 e l'id dell'elemento corrente per appendere il valore nella posizione corretta)
		let idGeneri = thisItem.genre_ids;
		idGeneri.forEach(element => {
			ajaxGenre(type, element, thisItem.id);
		});

		/* Chiamata AJAX per ricercare gli attori del film corrente*/
		let idItem = thisItem.id;
		ajaxAttori(idItem, type);
	}

	// mostro il pulsante filter
	$('#filter-btn').show();
	// setto il placeholder
	$('#input').attr('placeholder', 'Inserisci titolo');

}

// funzione per convertire il numero in stelle
function star(int) {
	const sF = '<i class="fas fa-star"></i>';
	const sE = '<i class="far fa-star"></i>';
	const sH = '<i class="fas fa-star-half-alt"></i>'
	// parte decimale
	let dec = int % 1;
	// numero di stelle piene
	let round = Math.floor(int / 2);
	return dec >= .5 ? sF.repeat(round) + sH + sE.repeat(4 - (round)) : sF.repeat(round) + sE.repeat(5 - round)
}

// funzione che ritorna l'immagine se presente sennò ritorna la stringa iniziale
function langFlags(lingua) {
	const language = ['en', 'it', 'fr', 'de', 'es', 'ja'];
	// se la stringa è presente restituisco il tag img sennò la stringa stessa
	if (language.includes(lingua)) {
		return `<img src="img/${lingua}.png" alt="${lingua}">`
	} else {
		return lingua
	}
}

// verifico se esiste qualche item del tipo selezioneto... lo stamo nel container del tipo
function noResult(tipo) {
	let location;
	tipo == 'movie' ? location = $('#movie-list') : location = $('#tv-list')
	console.log('niente da visualizzare');
	location.append(`<p class='no-search'>Il titolo non è presente in ${checkType(tipo)} </p>`);
}

// check se presente l'immagine nel db
function checkImage(path) {
	const defaultImg = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.ytimg.com%2Fvi%2FsvTVRDgI08Y%2Fmaxresdefault.jpg&f=1&nofb=1';
	return path == null ? defaultImg : `https://image.tmdb.org/t/p/w342${path}`
}

// transformo la stringa del genre 
function checkType(genre) {
	return genre == 'movie' ? 'Film' : 'Serie TV'
}

// matching del genere del film con l'array dei generi
function ajaxGenre(type, int, idMovie) {
	$.ajax({
		method: 'GET',
		url: `https://api.themoviedb.org/3/genre/${type}/list?api_key=5735ba8aa714f2161c6a9f7f267223ef&language=it-IT`,
		data: {
			api_key: '5735ba8aa714f2161c6a9f7f267223ef',
			language: 'it-IT'
		},
		success: function (obj) {
			// appendo la stringa corrispondente al genere nell'item con data-id = "id movie corrente"

			if (checkArray(obj.genres, int) != 'televisione film') {
				$(`.item[data-id="${idMovie}"`).find('.genere-span').append(`${checkArray(obj.genres, int)} `);
			}

		},
		error: function () {
			console.log('non presente id ' + idMovie);
			$(`.item[data-id="${idMovie}"`).find('.genere-span').append(`...`);
		}
	});
}

// passo un intero all'array dei generi e restituisco attributoto con id == intero passato
function checkArray(arr, int) {
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].id == int) {
			return arr[i].name
		}
	}
}

// chiamata ajax per la ricerca attori
function ajaxAttori(id, tipo) {
	$.ajax({
		method: 'GET',
		url: `https://api.themoviedb.org/3/${tipo}/${id}/credits`,
		data: {
			api_key: '5735ba8aa714f2161c6a9f7f267223ef'
		},
		success: function (obj) {
			findNameCast(obj.cast, id);
		},
		error: function () {
			console.log('non presente id ' + id);
			$(`.item[data-id="${id}"`).find('.attori').append(`...`);
		}
	});
}


// matchin del'id con in nome attore
function findNameCast(arr, id) {
	if (arr.length > 0) {
		for (let i = 0; i < 3; i++) {
			if (arr[i] != undefined) {
				$(`.item[data-id="${id}"`).find('.attori').append(`${arr[i].name} `);
			} else {
				return
			}
		}
	} else {
		$(`.item[data-id="${id}"`).find('.attori').append(`...`);
	}
}

// show o hide del genere premuto nel dropdown
function showGenre() {
	// click li -> chiusura dropdown
	$(this).parent().slideToggle(350);
	// genere scelto = data-genere
	let selectGenre = $(this).data('genere');
	// tutti gli item del DOM
	let elementiDom = $('.item');
	// se il genere è != 'all' inserisco nel testo del pulsante filter il genere selezionato
	if (selectGenre != 'all') {
		$('#filter-btn').text(capitalize(selectGenre));
	}

	// se il genere è 'all'
	if (selectGenre === 'all') {
		// inserisco scritta corretta nel pulsante filter
		$('#filter-btn').text('Filtra per genere');
		// mostro tutti gli item del DOM
		elementiDom.show();
	} else {
		// per ogni item
		elementiDom.each(function () {
			// se l'elemento in genere-span contiene il genere selezionato -> show, altrimenti -> hide dell'elemento
			if ($(this).find('.genere-span').text().toLowerCase().includes(selectGenre.toLowerCase())) {
				$(this).show();
			} else {
				$(this).hide();
			}
		});
	}
};

// capitalize di una stringa
function capitalize(stringa) {
	var primoCarattere = stringa.charAt(0).toUpperCase();
	return primoCarattere + stringa.slice(1).toLowerCase();
};

// cerca tutti i generi presenti nel DOM e crea il filter dropdown
function genreDom() {
	// svuoto il precedente elenco di generi in dropdown
	$('#filter-dropdown').empty();
	// generi = testo contenuto nello span genere-span
	let generi = $('.genere-span').text();
	// parola = array di tutte le parole presenti in generi (split con separatore ' ' )
	let parola = generi.split(' ');
	// reduce dell'array parola
	let oneGeneri = parola.reduce(function (acc, elem) {
		if (!acc.includes(elem) && elem != '' && elem != undefined && elem != '&' && elem != 'undefined') {
			acc.push(elem);
		}
		return acc
	}, ['All']);

	// in oneGeneri ho tutti i generi presenti nel DOM senza doppioni preceduti da All, per ogni elemento creo un <li> nel dropdown con data-genere='parola[i]'
	oneGeneri.forEach(element => {
		$('#filter-dropdown').append(`<li data-genere=${element.toLowerCase()}>${element}</li>`);
	});
}


/* *********************** */
/* SCROLL WITH MOUSE-WHEEL */
/* *********************** */

function scroll(section) {
	function scrollHorizontally(e) {
		e = window.event || e;
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		// larghezza width = 260px + 10 padding
		const width = 270;
		section.scrollLeft -= (delta * width);
		e.preventDefault();
	}
	if (section.addEventListener) {
		// IE9, Chrome, Safari, Opera
		section.addEventListener('mousewheel', scrollHorizontally, false);
		// Firefox
		section.addEventListener('DOMMouseScroll', scrollHorizontally, false);
	} else {
		// IE 6/7/8
		section.attachEvent('onmousewheel', scrollHorizontally);
	}
};

/* *********************** */
/* *********************** */
/* CREAZIONE pulsanti scroll */
function createScrollButtons(section) {
	$(`#${section}-list`).append(`<div class="scroll-left scroll">
	<i class="fas fa-chevron-left"></i>
	</div>
	<div class="scroll-right scroll" >
	<i class="fas fa-chevron-right"></i>
	</div>`);
}

/* FUNZIONE pulsanti scroll */
function scrollButtonMovie() {
	// se clicco i bottoni di scroll fermo l'auto scroll
	clearInterval((stopScroll1));
	let parentWidth = $(this).parent().width();
	if (this.className == 'scroll-left scroll') {
		$(this).parent()[0].scrollLeft -= (parentWidth);
	} else {
		$(this).parent()[0].scrollLeft += (parentWidth);
	}
}
/* END pulsanti scroll */
/* *********************** */
/* *********************** */