var RifInteract = (function() {
    "use strict";
    
    var type = function (dom, formatter, world, response_lib, rif) {
        this.id = 1;
        this.dom = dom;
        this.formatter = formatter;
        this._appendNewDiv();
        this.world = world;
        this.response_lib = response_lib;
        this.sectionsToHide = [];
        this.rif = rif;
        this.needsSeparator = false;
        this.separatorId = 0;
        this.separatorShown = "";
        var self = this;
        this.clickFactory = function (keywords) {
            return function (e) {
                var target = $(e.target);
                var original_color = target.css("color");
                target.animate({color: "#c0c000"}, 250).animate({color: original_color}, 300);
                self.sendCommand(keywords.split(" "));
            };
        };
    };

    function convertTopics(topics) {
        return topics.map(function(value) { return {keyword: value} });
    }

    type.prototype = {
        getNextId: function() {
            return "outputdiv" + this.id++;
        },
        say: function (says, response) {
            var formatted = this.formatter.formatOutput(says.text, this.clickFactory);
            console.log("say...", response);
            if (says.into) {
                var element = this.dom.getElementBySelector(says.into);
                $(element).html(formatted);
            } else {
                if (says.autohides) {
                    this.showAutoHideText(formatted);
                } else {
                    this.currentDiv.append(formatted);
                    this.currentDiv.append(" ");
                    this.dom.scrollToEnd();
                }
                this.showSeparator();
                this.needsSeparator = true;
            }
        },
        showAutoHideText: function (formatted) {
            var id = this.getNextId();
            this.beginSection(id);
            this.currentDiv.append(formatted);
            this.endSection();
            this.sectionsToHide.push(id);
            this.dom.scrollToEnd();
        },
        choose: function(options, callback) {
            var self = this;
            var clickfactory = function(i) {
                return function() {
                    self.hideSections();
                    callback(i);
                };
            };

            this.showAutoHideText(this.formatter.formatMenu(options, clickfactory));
        },
        beginSection: function(id) {
            this._appendNewDiv(id);
        },
        endSection: function() {
            this._appendNewDiv();
        },
        hideSection: function(id) {
            this.dom.removeElement('#'+id, 250);
        },
        _appendNewDiv: function(id) {
            var div = this.dom.createDiv(id);
            this.dom.append(div);
            this.currentDiv = div;
        },
        call: function(topics) {
            this.callTopics(topics);
        },
        callTopics: function(topics) {
            topics = convertTopics(topics);
            var responses = {};
            var caller = this.world.getPOV();
            var self = this;
            $.each(this.world.getCurrentResponders(caller), function(index, value) {
                responses[value] = self.rif.responses[value];
            });
            this.response_lib.callTopics(responses, topics, caller, this);
        },
        callActions: function(topics) {
            console.log("callActions");
            topics = convertTopics(topics);
            var actions = this.rif.actions;
            for (var actor in actions) {
                if (actions.hasOwnProperty(actor)) {
                    var responses = {};
                    responses[actor] = actions[actor];
                    console.log("call actions for ", actor);
                    console.info(responses);
                    this.response_lib.callTopics(responses, topics, actor, this);
                }
            }
        },
        animate: function(animates) {
            var self = this;
            $.each(animates.transitions, function(index, transition) {
                self.dom.animate(animates.selector, transition.to, transition.lasting);
            });
        },
        invoke: function(body) {
            var f = new Function(body);
            f();
        },
        hideSections: function () {
            if (this.sectionsToHide.length != 0) {
                var self = this;
                $.each(this.sectionsToHide, function (index, value) {
                    self.hideSection(value);
                });
                this.sectionsToHide = [];
            }
        },
        sendCommand: function(topics) {
            this.hideSections();
            this.beforeCommand();
            this.callTopics(topics);
            this.idleProcessing();
        },
        hideSeparator: function () {
            if (this.separatorShown) {
                console.log("hideSeparator " + this.separatorShown)
                this.dom.removeElement(this.separatorShown, 1);
                this.separatorShown = "";
            }
        },
        showNewSeparator: function () {
            var separator = "separator" + this.separatorId;
            var div = this.dom.createDiv();
            div.append("<div class='separatorholder'><div class='separator' style='display:none' id='" + separator + "'></div></div>");
            this.dom.append(div);
            this.separatorShown = '#'+separator;
            this.separatorId++;
            console.log("show new separator " + this.separatorShown);
        },
        showSeparator: function () {
            if (this.separatorShown) {
                console.log("show separator " + this.separatorShown);
                this.dom.showElement(this.separatorShown);
            }
        },
        beforeCommand: function() {
            if (this.needsSeparator) {
                this.hideSeparator();
                this.showNewSeparator();
                this.needsSeparator = false;
            }
            this.beginSection();
        },
        idleProcessing: function() {
            this.callActions(["ACT"]);
        },
        addResponseReferences : function(responses, new_responses) {
            var self = this;
            $.each(responses, function(index, value) {
                if (value.reference) {
                    var ref_responses = rif.responses[value.reference];
                    if (ref_responses) {
                        self.addResponseReferences(ref_responses, new_responses);
                    }
                } else {
                    new_responses.push(value);
                }
            });
        },
        expandResponseReferences: function(responses) {
            var new_responses = [];
            this.addResponseReferences(responses, new_responses);
            return new_responses;
        }
    };
    return type;
}());
