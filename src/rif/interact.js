define([], function() {
    "use strict";

    function resetMenuCallbacks() {
        this.menu_index = 0;
        this.menu_callbacks = {};
    }

    function convertTopics(topics) {
        return topics.map(function(value) { return {keyword: value} });
    }

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
                if (rif.clickEffect !== undefined) {
                    $.each(rif.clickEffect.transitions, function(index, transition) {
                        self.dom.animate(target, transition.to, transition.lasting);
                    });
                }
                self.sendCommand(convertTopics(keywords.split(" ")));
            };
        };
        resetMenuCallbacks.call(this);
    };

    function replaceMarkup(text, responder, world) {
        var index;
        while ((index = text.indexOf("{=")) != -1) {
            var end_index = text.indexOf("=}", index+2);
            if (end_index === -1) {
                break;
            }
            var id = text.substring(index+2, end_index);
            var value = world.getState(id.trim(), responder);
            text = text.substring(0, index) + value + text.substring(end_index+2);
        }
        return text;
    }

    function replaceCallMarkup(text) {
        var incoming_context = this.says_context;
        var says_context = incoming_context || { output_string: ""};

        while (text !== "") {
            var index = text.indexOf("{+");
            if (index === -1) {
                break;
            }
            var end_index = text.indexOf("+}", index+2);
            var topics = text.substring(index+2, end_index);
            says_context.output_string += text.substring(0, index);
            this.says_context = says_context;
            this.callTopicString(topics);
            text = text.substring(end_index+2);
        }
        says_context.output_string += text;
        if (incoming_context === undefined) {
            text = says_context.output_string;
        } else {
            text = null;
        }

        this.says_context = incoming_context;
        return text;
    }

    function outputFormattedText(says, formatted) {
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
    }

    type.prototype = {
        getNextId: function() {
            return "outputdiv" + this.id++;
        },
        say: function (says, responder) {
            var self = this;

            var text = replaceMarkup(says.text, responder, this.world);
            text = replaceCallMarkup.call(this, text);
            if (text === null) {
                // recursive call return
                return;
            }

            var formatted = this.formatter.formatOutput(text, this.clickFactory, this.menu_callbacks, says.as);
            outputFormattedText.call(this, says, formatted.node);
            resetMenuCallbacks.call(this);
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
            var index = this.menu_index++;
            this.menu_callbacks[index] = function(index) {
                self.hideSections();
                callback(index);
                self.idleProcessing();
            };
            var says = { text: this.formatter.formatMenu(options, index), autohides: true};
            this.say(says);
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
        callTopicString: function(topics) {
            var index = topics.indexOf('>');
            if (index >= 0) {
                var caller = topics.substring(index+1);
                topics = topics.substring(0, index);
                this.callTopicsForCaller(this.world.getState(caller), convertTopics(topics.split(" ")));
            } else {
                console.log("topics=" + topics);
                console.log("type=", typeof topics);
                this.callTopics(convertTopics(topics.split(" ")));
            }
        },
        call: function(topics) {
            this.callTopics(topics);
        },
        callTopicsForCaller: function (caller, topics) {
            var responders = this.world.getCurrentResponders(caller);
            this.callTopicsWithResponders(topics, responders, caller);
        },
        callTopics: function(topics) {
            this.callTopicsForCaller(this.world.getPOV(), topics);
        },
        getResponses: function (responders) {
            var responses = {};
            var self = this;
            $.each(responders, function (index, value) {
                responses[value] = self.expandResponseReferences(self.rif.responses[value]);
            });
            return responses;
        },
        callTopicsWithResponders: function(topics, responders, caller) {
            this.response_lib.callTopics(this.getResponses(responders), topics, caller, this);
        },
        callActions: function(topics) {
            //console.log("callActions");
            topics = convertTopics(topics);
            var actions = this.rif.actions;
            for (var actor in actions) {
                if (actions.hasOwnProperty(actor)) {
                    var responses = {};
                    responses[actor] = actions[actor];
                    //console.log("call actions for ", actor);
                    //console.info(responses);
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
                //console.log("hideSeparator " + this.separatorShown)
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
            //console.log("show new separator " + this.separatorShown);
        },
        showSeparator: function () {
            if (this.separatorShown && this.world.getState('show_separator')) {
                //console.log("show separator " + this.separatorShown);
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
            if (!responses) {
                return;
            }
            var self = this;
            $.each(responses, function(index, value) {
                if (value.reference) {
                    self.addResponseReferences(self.rif.responses[value.reference], new_responses);
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
});