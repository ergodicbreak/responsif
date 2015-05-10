describe("RifResponse", function () {
    "use strict";
    var responseLib;
    var interact;
    var world;
    beforeEach(function () {
        interact = {};
        world = {};
        responseLib = new RifResponse(world);
    });

    describe("responseIsEligible", function () {
        it("returns true for a simple response", function () {
            expect(responseLib.responseIsEligible({})).toEqual(true);
        });
        it("returns false if the run equals or exceeds its occurs count", function () {
            var response = { run: 5, occurs: 5 };
            expect(responseLib.responseIsEligible(response)).toEqual(false);
        });
        it("returns false if required state is not set", function () {
            world.getState = function(id) { return false; };
            var response = { needs: ["somestate"] };
            expect(responseLib.responseIsEligible(response)).toEqual(false);
        });
        it("returns false if disallowed state is set", function () {
            world.getState = function(id) { return true; };
            var response = { needs: ["!somestate"] };
            expect(responseLib.responseIsEligible(response)).toEqual(true);
        });
        it("returns correct value for multiple states", function () {
            world.getState = function(id) { return true; };
            var response = { needs: ["somestate", "!someotherstate"] };
            expect(responseLib.responseIsEligible(response)).toEqual(true);
        });
        it("returns false if required topics are not present", function () {
            var response = { matches: [{keyword: "*atopic"}] };
            expect(responseLib.responseIsEligible(response, [{keyword: "btopics"}])).toEqual(false);
        });
        it("passes the responder as state prefix if passed", function () {
            world.getState = function(id, responder) { return id === "somestate" && responder === "aresponder"; };
            var response = { needs: ["somestate"] };
            expect(responseLib.responseIsEligible(response, [], "aresponder")).toEqual(true);
        });
        it("passes the responder as state prefix if passed (negative)", function () {
            world.getState = function(id, responder) { return id === "!somestate" && responder === "aresponder"; };
            var response = { needs: ["!somestate"] };
            expect(responseLib.responseIsEligible(response, [], "aresponder")).toEqual(true);
        });
    });
    describe("computeScore", function () {
        it("returns 10000 if response topics is undefined", function () {
            var topics = [],
                score = responseLib.computeScore(undefined, topics);
            expect(score).toEqual(10000);
        });
        it("returns 10000 if response topics is empty", function () {
            var response_topics = [],
                topics = [],
                score = responseLib.computeScore(response_topics, topics);
            expect(score).toEqual(10000);
        });
        it("returns 0 if response topic doesn't match any topics", function () {
            var response_topics = [{keyword:"atopic"}],
                topics = [{keyword:"btopic"}],
                score = responseLib.computeScore(response_topics, topics);
            expect(score).toEqual(0);
        });
        it("returns 10000 if response topic matches any topic", function () {
            var response_topics = [{keyword:"atopic"}],
                topics = [{keyword:"atopic"}],
                score = responseLib.computeScore(response_topics, topics);
            expect(score).toEqual(10000);
        });
        it("returns higher score for multiple matching topics", function() {
            var response_topics = [{keyword:"atopic"}, {keyword:"btopic"}],
                topics = [{keyword:"atopic"}, {keyword:"btopic"}, {keyword:"ctopic"}],
                score = responseLib.computeScore(response_topics, topics);
            expect(score).toEqual(20000);
        });
        it("returns the right score for required topics", function () {
            var response_topics = [{keyword:"*atopic"}, {keyword:"btopic"}],
                topics = [{keyword:"atopic"}, {keyword:"btopic"}],
                score = responseLib.computeScore(response_topics, topics);
            expect(score).toEqual(20000);
        });
    });
    describe("selectResponses", function () {
        it("returns an empty list for no input", function () {
            var candidates = responseLib.selectResponses([], []);
            expect(candidates).toEqual([]);
        });
        it("returns all simple responses with score 10000", function () {
            var responses = [{a: 1}, {b: 2}, {c: 3}];
            var topics = [];
            var candidates = responseLib.selectResponses(responses, topics);
            expect(candidates).toEqual([{response: {a: 1}, score: 10000}, {response: {b: 2}, score: 10000},{response: {c: 3}, score: 10000}]);
        });
        it("returns the responder in the responses if passed", function () {
            var response = {a: 1};
            var responder = { a: 314 };
            var candidates = responseLib.selectResponses([response], [], responder);
            expect(candidates).toEqual([{response: response, score: 10000, responder: responder}]);
        });

        it("returns responses that match a topic", function () {
            var response1 = {a: 1, matches: [{keyword: "atopic"}]},
                response2 = {b: 2, matches: [{keyword: "btopic"}]},
                response3 = {c: 3, matches: [{keyword: "atopic"}]},
                responses = [response1, response2, response3],
                topics = [{keyword: "atopic"}],
                candidates = responseLib.selectResponses(responses, topics);
            expect(candidates).toEqual([{response: response1, score: 10000}, {response: response3, score: 10000}]);
        });
        it("returns responses that match one of multiple topics", function () {
            var response1 = {a: 1, matches: [{keyword: "atopic"}]},
                response2 = {b: 2, matches: [{keyword: "btopic"}]},
                response3 = {c: 3, matches: [{keyword: "atopic"}]},
                response4 = {d: 4, matches: [{keyword: "ctopic"}]},
                responses = [response1, response2, response3, response4],
                topics = [{keyword: "btopic"}, {keyword: "ctopic"}],
                candidates = responseLib.selectResponses(responses, topics);
            expect(candidates).toEqual([{response: response2, score: 10000}, {response: response4, score: 10000}]);
        });
        it("returns a higher score for more matched topics", function () {
            var response1 = {a: 1, matches: [{keyword: "atopic"}, {keyword: "btopic"}]},
                response2 = {b: 2, matches: [{keyword: "btopic"}]},
                responses = [response1, response2],
                topics = [{keyword: "atopic"}, {keyword: "btopic"}],
                candidates = responseLib.selectResponses(responses, topics);
            expect(candidates).toEqual([{response: response1, score: 20000}, {response: response2, score: 10000}]);
        });
        it("returns responses whose count does not exceed maxcount", function () {
            var response1 = {a: 1, occurs: 10},
                response2 = {b: 2, run: 4, occurs: 4 },
                response3 = {c: 3},
                response4 = {d: 4, run: 5 },
                responses = [response1, response2, response3, response4],
                topics = [],
                candidates = responseLib.selectResponses(responses, topics);
            expect(candidates).toEqual([{response: response1, score: 10000}, {response: response3, score: 10000}, {response: response4, score: 10000}]);
        });
        it("returns the right score for a required topic", function () {
            var response1 = {a: 1, matches: [{keyword: "*atopic"}]},
                responses = [response1],
                topics = [{keyword: "atopic"}],
                candidates = responseLib.selectResponses(responses, topics);
            expect(candidates).toEqual([{response: response1, score: 10000}]);
        });
        it("returns eligible child responses", function () {
            var response1 = {a: 1, matches: [{keyword: "atopic"}]},
                response2 = {b: 2, matches: [{keyword: "btopic"}]},
                response3 = {c: 3},
                response4 = {d: 4, run: 4, occurs: 4 },
                parentresponse = { groups: [response1, response2, response3, response4] },
                responses = [parentresponse],
                topics = [{keyword: "atopic"}],
                candidates = responseLib.selectResponses(responses, topics);
            expect(candidates).toEqual([{response: response1, score: 10000}, {response: response3, score: 10000}]);
        });
        it("does not return eligible child responses if the parent is ineligible", function () {
            var response1 = {a: 1},
                parentresponse = { matches:[{keyword: "*atopic"}], groups: [response1] },
                responses = [parentresponse],
                topics = [],
                candidates = responseLib.selectResponses(responses, topics);
            expect(candidates).toEqual([]);
        });
    });
    describe("getPriorityResponses", function () {
        it("returns an empty list for no input", function () {
            var responses = responseLib.getPriorityResponses([]);
            expect(responses).toEqual([]);
        });
        it("returns a single entry", function () {
            var response1 = {a: 1, score: 10000};
            var responses = responseLib.getPriorityResponses([response1]);
            expect(responses).toEqual([response1]);
        });
        it("returns the entry with the higher score for two entries", function () {
            var response1 = {a: 1, score: 10000};
            var response2 = {a: 2, score: 20000};
            var responses = responseLib.getPriorityResponses([response1, response2]);
            expect(responses).toEqual([response2]);
        });
        it("returns all the entries with the highest score", function () {
            var response1 = {a: 1, score: 10000};
            var response2 = {a: 2, score: 20000};
            var response3 = {a: 3, score: 20000};
            var response4 = {a: 4, score: 15000};
            var responses = responseLib.getPriorityResponses([response1, response2, response3, response4]);
            expect(responses).toEqual([response2, response3]);
        });
    });
    describe("processResponses", function () {
        describe("general", function () {
            it("increments the response run count by one", function () {
                var candidate = { response: { }, score: 10000 };
                var candidates = [candidate];
                responseLib.processResponses(candidates, "", interact);
                expect(candidate.response.run).toBe(1);
                responseLib.processResponses(candidates, "", interact);
                expect(candidate.response.run).toBe(2);
            });
            it("groups responses by type", function () {
                var output = "";
                interact.say = function(says) { output += says.text; };
                responseLib.setTypes(["a","b","c"]);
                var responses = [
                    { response: { is:"c", does: { common: [ {says: { text: "C!"} } ] } }, score: 10000 },
                    { response: { is:"b", does: { common: [ {says: { text: "B!"} } ] } }, score: 10000 },
                    { response: { is:"a", does: { common: [ {says: { text:  "A!"} } ] } }, score: 10000 },
                    { response: { is:"b", does: {common: [ {says: { text:  "B again!"} } ] } }, score: 10000 }
                ];
                responseLib.processResponses(responses, "", interact);
                expect(output).toEqual("A!B!B again!C!");
            });
            it("orders responses", function () {
                var output = "";
                interact.say = function(says) { output += says.text; };
                responseLib.setTypes(["a","b","c"]);
                var responses = [
                    { response: { orders:99, does: { common: [ {says: { text: "C!"} } ] } }, score: 10000 },
                    { response: { does: { common: [ {says: { text: "B!"} } ] } }, score: 10000 },
                    { response: { orders:10, does: { common: [ {says: { text:  "A!"} } ] } }, score: 10000 },
                    { response: { does: {common: [ {says: { text:  "B again!"} } ] } }, score: 10000 }
                ];
                responseLib.processResponses(responses, "", interact);
                expect(output).toEqual("B!B again!A!C!");
            });
        });
        describe("says", function () {
            it("text for a matching response", function() {
                interact.say = jasmine.createSpy("say");
                var candidate = {
                    response: {
                        does: { common: [ { says: { text: "Hello world!" } } ] }
                    }, score: 10000 };
                responseLib.processResponses([candidate], "", interact);
                expect(interact.say).toHaveBeenCalledWith({ text: "Hello world!" }, candidate.response);
            });
            it("no text for no matching responses", function() {
                interact.say = jasmine.createSpy("say");
                responseLib.processResponses([], "", interact);
                expect(interact.say).not.toHaveBeenCalled();
            });
            it("text for all matching responses", function() {
                interact.say = jasmine.createSpy("say");
                var candidate1 = { response: { does: { common: [ {says: { text: "Hello world!"} } ] } }, score: 10000 };
                var candidate2 = { response: { does: { common: [ {says: { text: "Goodnight moon!"} } ] } }, score: 10000 };
                responseLib.processResponses([candidate1, candidate2], "", interact);
                expect(interact.say.callCount).toEqual(2);
                expect(interact.say.argsForCall[0]).toEqual([{ text: "Hello world!" }, candidate1.response]);
                expect(interact.say.argsForCall[1]).toEqual([{ text: "Goodnight moon!" }, candidate2.response]);
            });
            it("text only for matching responses that have text", function() {
                interact.say = jasmine.createSpy("say");
                var candidate1 = { response: { }, score: 10000 };
                var candidate2 = { response: { does: { common: [ {says: { text: "See ya later!"} } ] } }, score: 10000 };
                responseLib.processResponses([candidate1, candidate2], "", interact);
                expect(interact.say.callCount).toEqual(1);
                expect(interact.say.argsForCall[0]).toEqual([{ text: "See ya later!" }, candidate2.response]);
            });
            it("text in proper sequence", function() {
                interact.say = jasmine.createSpy("say");
                var candidate = {
                    response: {
                        does: {
                            common: [ {says: { text: "See ya later!"} } ],
                            1: [ {says: { text: "Hello world!"} } ],
                            3: [ {says: { text: "I'm going"} } ]
                        }
                    },
                    score: 10000
                };
                var candidates = [candidate];
                responseLib.processResponses(candidates, "", interact);
                responseLib.processResponses(candidates, "", interact);
                responseLib.processResponses(candidates, "", interact);
                responseLib.processResponses(candidates, "", interact);
                expect(interact.say.argsForCall).toEqual([
                    [{ text: "Hello world!"}, candidate.response],
                    [{ text: "See ya later!"}, candidate.response],
                    [{ text: "I'm going"}, candidate.response],
                    [{ text: "See ya later!"}, candidate.response]
                ]);
            });
            it("replaces in-line markup with state values", function() {
                interact.say = jasmine.createSpy("say");
                world.getState = function(id) {
                    if (id === "name") {
                        return "Ishmael";
                    } else if (id === "yourname") {
                        return "mud";
                    } else {
                        return false;
                    }
                };
                var candidate = {
                    response: {
                        does: { common: [ { says: { text: "My name is {=name=}. Your name is {= yourname  =}." } } ] }
                    }, score: 10000 };
                responseLib.processResponses([candidate], "", interact);
                expect(interact.say).toHaveBeenCalledWith({ text: "My name is Ishmael. Your name is mud." }, candidate.response);
            });
            describe("says with 'call' markup", function() {
                it("should invoke 'call' on the interact for a topic", function() {
                    interact.say = jasmine.createSpy("say");
                    interact.call = jasmine.createSpy("call");
                    var candidate = {
                        response: {
                            does: { common: [ { says: { text: "My name is {+NAME+}." } } ] }
                        }, score: 10000 };
                    responseLib.processResponses([candidate], "", interact);
                    expect(interact.call).toHaveBeenCalledWith(["NAME"]);
                });
                it("should invoke 'call' on the interact for multiple topic", function() {
                    interact.say = jasmine.createSpy("say");
                    interact.call = jasmine.createSpy("call");
                    var candidate = {
                        response: {
                            does: { common: [ { says: { text: "My name is {+FIRST NAME+}." } } ] }
                        }, score: 10000 };
                    responseLib.processResponses([candidate], "", interact);
                    expect(interact.call).toHaveBeenCalledWith(["FIRST", "NAME"]);
                });
                function fakeCall(topics) {
                    if (topics[0] == "NAME") {
                        interact.say({ text: "Ishmael" });
                    } else {
                        interact.say({ text: "Nemo" });
                    }
                };
                it("should 'say' the individual pieces of text in the correct order", function() {
                    interact.say = jasmine.createSpy("say");
                    interact.call = jasmine.createSpy("call");
                    interact.call.andCallFake(fakeCall);
                    var candidate = {
                        response: {
                            does: { common: [ { says: { text: "My name is {+NAME+}." } } ] }
                        }, score: 10000 };
                    responseLib.processResponses([candidate], "", interact);
                    expect(interact.say.callCount).toBe(3);
                    expect(interact.say.argsForCall[0]).toEqual([{ text: "My name is " }, candidate.response]);
                    expect(interact.say.argsForCall[1]).toEqual([{ text: "Ishmael" }]);
                    expect(interact.say.argsForCall[2]).toEqual([{ text: "." }, candidate.response]);
                });
                it("should handle multiple 'calls' markups", function() {
                    interact.say = jasmine.createSpy("say");
                    interact.call = jasmine.createSpy("call");
                    interact.call.andCallFake(fakeCall);
                    var candidate = {
                        response: {
                            does: { common: [ { says: { text: "My name is {+NAME+}, but you're just {+FISH+}." } } ] }
                        }, score: 10000 };
                    responseLib.processResponses([candidate], "", interact);
                    expect(interact.say.callCount).toBe(5);
                    expect(interact.say.argsForCall[0]).toEqual([{ text: "My name is " }, candidate.response]);
                    expect(interact.say.argsForCall[1]).toEqual([{ text: "Ishmael" }]);
                    expect(interact.say.argsForCall[2]).toEqual([{ text: ", but you're just " }, candidate.response]);
                    expect(interact.say.argsForCall[3]).toEqual([{ text: "Nemo" }]);
                    expect(interact.say.argsForCall[4]).toEqual([{ text: "." }, candidate.response]);
                });
            });
        });
        describe("prompts", function () {
            it("shows prompts in a menu", function () {
                interact.choose = jasmine.createSpy("choose");
                var candidate1 = {response: {prompts: "Go north"}, score: 10000};
                var candidate2 = {response: {prompts: "Go south"}, score: 10000};
                responseLib.processResponses([candidate1, candidate2], "", interact);
                expect(interact.choose).toHaveBeenCalledWith(["Go north", "Go south"], jasmine.any(Function));
            });
            it("processes a single prompt as a normal response", function () {
                interact.say = jasmine.createSpy("say");
                interact.choose = jasmine.createSpy("choose");
                var candidate1 = { response: { prompts: "Go north", does: { common: [ { says: { text: "something" } } ] } }, score: 10000 };
                responseLib.processResponses([candidate1], "", interact);
                expect(interact.choose).not.toHaveBeenCalled();
                expect(interact.say).toHaveBeenCalled();
            });
            it("processes a single prompt as a prompt if 'forcesprompt' is set", function () {
                interact.choose = jasmine.createSpy("choose");
                var candidate1 = { response: { prompts: "Go north", forcesprompt: true }, score: 10000 };
                responseLib.processResponses([candidate1], "", interact);
                expect(interact.choose).toHaveBeenCalledWith(["Go north"], jasmine.any(Function));
            });
            it("passes a callback function to be invoked when an item is chosen", function () {
                interact.choose = jasmine.createSpy("choose");
                interact.say = jasmine.createSpy("say");
                var candidate1 = { response: { prompts: "Go north", does: { common: [ { says: { text: "North" } } ] } }, score: 10000 };
                var candidate2 = { response: { prompts: "Go south", does: { common: [ { says: { text: "South" } } ] }  }, score: 10000 };
                responseLib.processResponses([candidate1, candidate2], "", interact);
                var callback = interact.choose.mostRecentCall.args[1];
                callback(1);
                expect(interact.say).toHaveBeenCalledWith({text: "South"}, candidate2.response);
            });
            it("does nothing if the menu callback is called with -1", function () {
                interact.choose = jasmine.createSpy("choose");
                interact.say = jasmine.createSpy("say");
                var candidate1 = { response: { prompts: "Go north", does: { common: [ { says: { text: "North" } } ] } }, score: 10000 };
                var candidate2 = { response: { prompts: "Go south", does: { common: [ { says: { text: "South" } } ] }  }, score: 10000 };
                responseLib.processResponses([candidate1, candidate2], "", interact);
                var callback = interact.choose.mostRecentCall.args[1];
                callback(-1);
                expect(interact.say).not.toHaveBeenCalled();
            });
            it ("combines multiple responses with the same prompt under one menu choice", function () {
                interact.choose = jasmine.createSpy("choose");
                var candidate1 = { response: { prompts: "prompt1" }, score: 10000 };
                var candidate2 = { response: { prompts: "prompt1" }, score: 10000 };
                var candidate3 = { response: { prompts: "prompt2" }, score: 10000 };
                responseLib.processResponses([candidate1, candidate2, candidate3], "", interact);
                expect(interact.choose).toHaveBeenCalledWith(["prompt1", "prompt2"], jasmine.any(Function));
            });
            it ("executes multiple responses with the same prompt when chosen", function () {
                interact.choose = jasmine.createSpy("choose");
                interact.say = jasmine.createSpy("say");
                var candidate1 = {response: {prompts: "prompt1", does: {common: [ {says: { text: "North" } } ] } }, score: 10000};
                var candidate2 = {response: {prompts: "prompt1", does: {common: [ {says: { text: "North2" } } ] } }, score: 10000};
                var candidate3 = {response: {prompts: "prompt2", does: {common: [ {says: { text: "South" } } ] } }, score: 10000};
                responseLib.processResponses([candidate1, candidate2, candidate3], "", interact);
                var callback = interact.choose.mostRecentCall.args[1];
                callback(0);
                expect(interact.say.callCount).toEqual(2);
                expect(interact.say.argsForCall[0]).toEqual([{ text: "North" }, candidate1.response]);
                expect(interact.say.argsForCall[1]).toEqual([{ text: "North2" }, candidate2.response]);
            });
        });
        describe("sets", function() {
            function spyOnSetState() {
                world.setState = jasmine.createSpy("setState");
            }
            it("sets state for a single id with 'sets' attribute", function () {
                spyOnSetState();
                var response = { response: { does: { common: [ { sets: ["somestate"] } ] } }, score: 10000 };
                responseLib.processResponses([response], "", interact);
                expect(world.setState).toHaveBeenCalledWith("somestate", "");
            });
            it("sets state for multiple ids with 'sets' attribute", function () {
                spyOnSetState();
                var response = { response: { does: { common: [ { sets: ["somestate", "someotherstate"] } ] } }, score: 10000 };
                responseLib.processResponses([response], "", interact);
                expect(world.setState.callCount).toEqual(2);
                expect(world.setState.argsForCall[0]).toEqual(["somestate", ""]);
                expect(world.setState.argsForCall[1]).toEqual(["someotherstate", ""]);
            });
            it("includes the responder if passed", function () {
                spyOnSetState();
                var response = { response: { does: { common: [ { sets: [":somestate"] } ] } }, score: 10000, responder: "aresponder" };
                responseLib.processResponses([response], "", interact);
                expect(world.setState).toHaveBeenCalledWith(":somestate", "aresponder");
            });
        });
        describe("uses all", function() {
            it("processes all the eligible child responses", function() {
                interact.say = jasmine.createSpy("say");
                world.getState = function(id) { return  false;};
                var response1 = { does: { common: [ { says: {text: "Text 1"} } ] } };
                var response2 = { needs: "somestate", does: { common: [ { says: {text: "Text 2"} } ] } };
                var response3 = { does: { common: [ { says: {text: "Text 3"} } ] } };
                var response = {
                    response: {
                        does: {
                            common: [ {
                                uses: {
                                    all: [
                                        response1,
                                        response2,
                                        response3
                                    ]
                                }
                            } ]
                        }
                    },
                    score: 10000,
                    responder: "aresponder" };
                responseLib.processResponses([response], "", interact);
                expect(interact.say.callCount).toEqual(2);
                expect(interact.say.argsForCall[0]).toEqual([{ text: "Text 1" }, response1]);
                expect(interact.say.argsForCall[1]).toEqual([{ text: "Text 3" }, response3]);
            });
        });
        describe("uses first", function() {
            it("processes up to the first eligible child responses", function() {
                interact.say = jasmine.createSpy("say");
                world.getState = function(id) { return  false;};
                var response1 = { needs: "somestate", does: { common: [ { says: {text: "Text 1"} } ] } };
                var response2 = { does: { common: [ { says: {text: "Text 2"} } ] } };
                var response3 = { does: { common: [ { says: {text: "Text 3"} } ] } };
                var response = {
                    response: {
                        does: {
                            common: [ {
                                uses: {
                                    first: [
                                        response1,
                                        response2,
                                        response3
                                    ]
                                }
                            } ]
                        }
                    },
                    score: 10000,
                    responder: "aresponder" };
                responseLib.processResponses([response], "", interact);
                expect(interact.say.callCount).toEqual(1);
                expect(interact.say.argsForCall[0]).toEqual([{ text: "Text 2" }, response2]);
            });
        });
        describe("calls", function () {
            it("should call the specified topics", function() {
                interact.call = jasmine.createSpy("call");
                var candidate = {
                    response: {
                        does: { common: [ { calls: [ "aTopic", "bTopic", "cTopic" ] } ] }
                    }, score: 10000 };
                responseLib.processResponses([candidate], "", interact);
                expect(interact.call).toHaveBeenCalledWith([ "aTopic", "bTopic", "cTopic" ]);
            });
        });
        describe("animates", function () {
            it("should animate", function() {
                interact.animate = jasmine.createSpy("animate");
                var candidate = {
                    response: {
                        does: { common: [ { animates: {selector: "aselector", transitions: [{to: "options", lasting: 1000} ] } } ] }
                    }, score: 10000 };
                responseLib.processResponses([candidate], "", interact);
                expect(interact.animate).toHaveBeenCalledWith( {selector: "aselector", transitions: [ {to: "options", lasting: 1000} ] } );
            });
        });
        describe("invokes", function () {
            it("should invoke the specified function", function() {
                interact.invoke = jasmine.createSpy("invoke");
                var candidate = {
                    response: {
                        does: { common: [ { invokes: "some function body" } ] }
                    }, score: 10000 };
                responseLib.processResponses([candidate], "", interact);
                expect(interact.invoke).toHaveBeenCalledWith("some function body");
            });
        });
        describe("moves", function () {
            it("should set the specified object parent", function() {
                world.setParent = jasmine.createSpy("setParent");
                var candidate = {
                    response: {
                        does: { common: [ { moves: { target: "thing", to: "room"} } ] }
                    }, score: 10000 };
                responseLib.processResponses([candidate], "", interact);
                expect(world.setParent).toHaveBeenCalledWith("thing", "room");
            });
        });
        describe("suggests", function () {
            it("should suggest the topics", function() {
                interact.suggest = jasmine.createSpy("suggest");
                var candidate = {
                    response: {
                        does: { common: [ { suggests: ["topicA", "topicB", "topicC"] } ] }
                    }, score: 10000 };
                responseLib.processResponses([candidate], "", interact);
                expect(interact.suggest).toHaveBeenCalledWith(["topicA", "topicB", "topicC"]);
            });
        });
    });
    describe("callTopics", function () {
        it("invokes responses correctly", function () {
            interact.say = jasmine.createSpy("say");
            var response1 = { matches: [{keyword: "atopic"}], does: { common: [ { says: { text: "This is response 1" } } ] } };
            var response2 = { matches: [{keyword: "ctopic"}], does: { common: [ { says: { text: "This is response 2" } } ] } };
            var response3 = { matches: [{keyword: "btopic"}], does: { common: [ { says: { text: "This is response 3" } } ] } };
            var responses = [response1, response2, response3];
            responseLib.callTopics({responder: responses}, [{keyword: "ctopic"}], "caller", interact);
            expect(interact.say).toHaveBeenCalledWith({ text: "This is response 2" }, response2);
        });
    });
});