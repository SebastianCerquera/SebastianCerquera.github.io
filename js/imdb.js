var selectors = {
    search: '#bs-example-navbar-collapse-1 > ul > li > a',
    searchLabel: 'body > div > div.row > div > h1 > small',

    modalSearch: 'body > nav > div.modal.fade',
    modalSearchSubmit: 'body > nav > div.modal.fade > div.modal-dialog.modal-sm > div > div.modal-footer > button.btn.btn-primary',
    modalSearchInput: 'body > nav > div.modal.fade > div.modal-dialog.modal-sm > div > div.modal-body > form > div > div > input',

    modalFull: 'body > div > div.modal.fade',
    modalFullEpisodes: 'body > div > div.modal.fade .episodes',
    modalFullPagiation: 'body > div > div.modal.fade .modal-body .pagination',
    modalFullSubmit: 'body > div > div.modal.fade > div.modal-dialog.modal-sm > div > div.modal-footer > button.btn.btn-primary',

    parent: 'body > div.container div.movies',
    descriptionSelector: 'description-short'
};

var defaultPoster = '/Oe7HeT0oiojRz6NSQfFu6fIJzi.jpg';
buildEntry = function(entry) {
    if (entry.poster_path === null)
        entry.poster_path = defaultPoster;
    var template = ['<div data-id=', entry.id, ' class="col-md-4 portfolio-item">', '<img class="img-responsive" src="http://image.tmdb.org/t/p/w500', entry.poster_path, '?api_key=2a6fd2d3356476f3bf594deb013e4f76" alt="">', '<h3>', '<a href="#">' + entry.original_name + '</a>', '</h3>', '</div>'].join('');
    var $element = $(template);
    $element.data('item', entry);
    return $element;
};

buildDescription = function(entry) {
    return $(['<div class="', selectors.descriptionSelector, '">', '<p> Promedio Votos: ', entry.vote_average, '</p>', '<p> Número Votos: ', entry.vote_count, '</p>',
        '</div>'
    ].join(''));
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

var page = 1,
    pages = 1;
infiniteHandler = function(result) {
    page = result.page;
    pages = result.total_pages;
    drawResults(result.results);
};

/*
 * FIXME solo dibujar multiplos de 3
 */
var toDraw = [];
drawResults = function(results) {
    toDraw = results.splice(9);
    if (toDraw.length === 0)
        if (page < pages)
            $.getJSON(request + '&page=' + (page + 1)).done(infiniteHandler);
    drawGrid(buildGrid(results.map(buildEntry)));
};

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

var request;
searchByName = function(text) {
    $(selectors.parent).html('');
    $(selectors.searchLabel).html(text);
    request = 'http://api.themoviedb.org/3/search/tv?query=' + text + '&api_key=2a6fd2d3356476f3bf594deb013e4f76';
    $.getJSON(request).done(infiniteHandler);
};

buildChapterList = function(season){
    var i, result = [];
    for(i = 0; i < season.episodes.length; i++)
        result.push('<li data-id=' + i + ' class="list-group-item">' + season.episodes[i].name + '</li>');
    return '<ul class="list-group">'+ result.join('') + '</ul>';
};

fillPage = function(serie, season){
    /*
     * TODO Solo pedir el archivo una vez
     */
    $.getJSON('http://api.themoviedb.org/3/tv/' + serie.id + '/season/' + season + '?api_key=2a6fd2d3356476f3bf594deb013e4f76').done(function(data){
        var $element = $('div[data-id=' + serie.id +']');
        var seasons = $element.data('seasons');
        if(!seasons)
            seasons = {};
        seasons[season] = data;
        $element.data('seasons', seasons);
        $(selectors.modalFullEpisodes).html(buildChapterList(data));
    });
};

buildPagination = function(seasons) {
    var i, results = [];
    for (i = 1; i <= seasons; i++)
        results.push('<li data-id="' + i + '"><a>' + i + '</a></li>');
    return results.join('');
};

completeHandler = function(data, modal, entry) {
    var $element = $('div[data-id=' + entry.id +']');
    $element.data('item', data);
    $(selectors.modalFullPagiation).html(buildPagination(data.number_of_seasons));
    $(selectors.modalFullPagiation).data('item',entry);
    fillPage(entry, 1);
};

clickHandler = function(e) {
    var modal = $(selectors.modalFull);
    var entry = this.parent().data('item');

    $.getJSON('http://api.themoviedb.org/3/tv/' + entry.id + '?api_key=2a6fd2d3356476f3bf594deb013e4f76').done(function(data) {
        return completeHandler(data, modal, entry);
    });

    modal.find('.modal-title').html(entry.original_name);
    modal.find('.modal-body  div.poster').html(buildEntry(entry).html());
    modal.modal();
};

enterHandler = function(e) {
    var description = buildDescription(this.parent().data('item'));
    this.parent().append(description);
};

leaveHandler = function(e) {
    this.parent().find('.' + selectors.descriptionSelector).remove();
};

scrollHandler = function(e) {
    if ($(window).scrollTop() + $(window).innerHeight() < $(selectors.parent)[0].scrollHeight)
        return;
    drawResults(toDraw);
};

paginationHandler = function(e){
    var entry = this.parent().parent().data('item');
    fillPage(entry, this.parent().data('id'));
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
    $(selectors.parent).on('dblclick', delegate('.movies .portfolio-item img', clickHandler));
    $(selectors.modalFull).on('click', delegate('.modal-body .pagination a', paginationHandler));

    $(window).on('scroll', scrollHandler);

    /*
     * FIX listens to img in the modal
     */
    $(window).on('mouseenter', delegate('.movies .portfolio-item img', enterHandler));
    $(window).on('mouseleave', delegate('.movies .portfolio-item img', leaveHandler));
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
        callback.call(parent, e);
    };
};
