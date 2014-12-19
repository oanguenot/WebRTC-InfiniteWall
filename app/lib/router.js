var application = require('application'),
    me = require('./me');


function getQueryParams(qs) {
    qs = qs.split("+").join(" ");

    var params = {}, tokens = true, re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens) {
        tokens = re.exec(qs);
        if (tokens) {
            params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
        }
    }

    return params;
};

Backbone.Mediator.subscribe('goto', function(route) {
    application.route(route);
});

module.exports = Backbone.Router.extend({
    routes: {
        '': 'home',
        'join?:querystring': 'onParticipantJoin',
        'mainPage': 'mainPage'
    },
    
    home: function() {
        $('body').html(application.homeView.render().el);
    },

    mainPage: function() {
    	$('body').html(application.mainView.render().el);
    },

    onParticipantJoin: function() {
        var url = window.location.hash.substr(5);

        params = getQueryParams(url);

        $('body').html(application.homeView.render().el);

        application.homeView.setRoom(params.room);
        
    }
});
