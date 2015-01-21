var selectors = {
    search: '#bs-example-navbar-collapse-1 > ul > li > a',
    searchLabel: 'body > div > div.row > div > h1 > small',

    modalSearch: 'body > nav > div.modal.fade',
    modalSearchSubmit: 'body > nav > div.modal.fade > div.modal-dialog.modal-sm > div > div.modal-footer > button.btn.btn-primary',
    modalSearchInput: 'body > nav > div.modal.fade > div.modal-dialog.modal-sm > div > div.modal-body > form > div > div > input',

    parent: 'body > div.container div.movies',
    descriptionSelector: 'description-short'
};

var defaultPoster = 'http://placehold.it/700x400';
buildEntry = function(entry) {
    if (!entry.Poster)
        entry.Poster = defaultPoster;
    var template = ['<div data-id=', entry.imdbID, ' class="col-md-4 portfolio-item">', '<a href="#">', '<img class="img-responsive" src="', entry.Poster, '" alt="">',
        '</a>', '<h3>', '<a href="#">' + entry.Title + '</a>', '</h3>', '</div>'
    ].join(' ');
    return $(template);
};

buildDescription = function(entry) {
    if (entry.Actors === 'N/A')
        return $(['<div class="', selectors.descriptionSelector, '">', '<p> Rating: ', entry.imdbRating, '</p>', '</div>'].join(''));

    var actors = entry.Actors.split(',');
    actors.splice(3);

    return $(['<div class="', selectors.descriptionSelector, '">', '<p> Rating: ', entry.imdbRating, '</p>', '<p> Actores: ', actors.join(','), '</p>', '</div>'].join(''));
};

buildGrid = function(entries) {
    var i, size = entries.length - 1,
        result = [],
        row = [];
    for (i = 0; i < size; i++) {
        if ((i + 1) % 3 === 0) {
            row.push(entries[i]);
            result.push(row);
            row = [];
            continue;
        }

        row.push(entries[i]);
    }
    row.push(entries[size]);
    result.push(row);

    return result;
};

/*Validar poster*/
byIdHandler = function(data) {
    var entry = $('div[data-id=' + data.imdbID + ']');
    entry.data('info', data);

    if (data.Poster === 'N/A')
        return;

    entry.find('img').attr('src', data.Poster);
};

completeInfo = function(movie) {
    $.getJSON('http://www.omdbapi.com/?i=' + movie.imdbID + '&plot=full&r=json').done(byIdHandler);
};

/*infinite scroll*/
toDraw = [];
drawResults = function(result) {
    toDraw = result.Search.splice(9);
    drawGrid(buildGrid(result.Search.map(buildEntry)));

    result.Search.forEach(function(entry) {
        completeInfo(entry);
    });
};

/*Falta completar imagen*/
drawGrid = function(grid) {
    var template = '<div class="row"></div>';
    grid.forEach(function(item) {
        var row = $(template);

        item.forEach(function(entry) {
            row.append(entry);
        });

        $(selectors.parent).append(row);
    });
};

searchByName = function(text) {
    $(selectors.parent).html('');
    $(selectors.searchLabel).html(text);
    $.getJSON('http://www.omdbapi.com/?s=' + text + '&r=json').done(drawResults);
};

clickHandler = function(e) {
    console.log(this.parent().parent().data('info'));
};

enterHandler = function(e) {
    var description = buildDescription(this.data('info'));
    this.append(description);
};

leaveHandler = function(e) {
    this.find('.' + selectors.descriptionSelector).remove();
};

$(document).ready(function() {
    $(selectors.search).click(function() {
        $(selectors.modalSearch).modal('show');
    });

    $(selectors.modalSearchSubmit).click(function() {
        /*
         * TODO Validar entrada
         */

        searchByName($(selectors.modalSearchInput).val());

        $(selectors.modalSearch).modal('hide');
    });

    searchByName('ga');

    $(parent).click(delegate('img', clickHandler));

    $(parent).on('mouseenter', delegate('img', enterHandler));
    $(parent).on('mouseleave', delegate('img', leaveHandler));
});



delegate = function(selector, callback) {
    return function(e) {
        var target = $(e.target),
            parent;
        /*
         * Check closest documentation
         */
        if (!(parent = target.closest(selector)).length)
            return;

        callback.call(parent.parent().parent(), e);
    };
};
