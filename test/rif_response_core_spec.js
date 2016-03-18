define(['rif/response_core'], function(rifResponseCore) {
    describe("computeScore", function () {
        var world;
        beforeEach(function() {
            world =  {
                getState: jasmine.createSpy('getState').andCallFake(function(id, responder) {
                    return parseFloat(id);
                })
            };
        });
        it("returns 1 if response topics is undefined", function () {
            expect(rifResponseCore.computeScore({}, [], 'responder', world)).toEqual(1);
        });
        it("returns 1 if response topics is empty", function () {
            var response_topics = [],
                topics = [],
                response = {matches: response_topics},
                score = rifResponseCore.computeScore(response, topics, 'responder', world);
            expect(score).toEqual(1);
        });
        it("returns 0 if response topic doesn't match any topics", function () {
            var response_topics = [{keyword:"atopic"}],
                topics = [{keyword:"btopic"}],
                score = rifResponseCore.computeScore({matches: response_topics}, 'responder', world);
            expect(score).toEqual(0);
        });
        it("returns 1 if response topic matches any topic", function () {
            var response_topics = [{keyword:"atopic"}],
                topics = [{keyword:"atopic"}],
                score = rifResponseCore.computeScore({matches: response_topics}, topics, 'responder', world);
            expect(score).toEqual(1);
        });
        it("returns higher score for multiple matching topics", function() {
            var response_topics = [{keyword:"atopic"}, {keyword:"btopic"}],
                topics = [{keyword:"atopic"}, {keyword:"btopic"}, {keyword:"ctopic"}],
                score = rifResponseCore.computeScore({matches: response_topics}, topics, 'responder', world);
            expect(score).toEqual(2);
        });
        it("returns the right score for required topics", function () {
            var response_topics = [{keyword:"*atopic"}, {keyword:"btopic"}],
                topics = [{keyword:"atopic"}, {keyword:"btopic"}],
                score = rifResponseCore.computeScore({matches: response_topics}, topics, 'responder', world);
            expect(score).toEqual(2);
        });
        it("computes the score based on explicit weights", function () {
            var response_topics = [{keyword:"atopic", weight: 0.2}],
                topics = [{keyword:"atopic", weight: 0.9}],
                score = rifResponseCore.computeScore({matches: response_topics}, topics, 'responder', world);
            expect(score).toEqual(0.2*0.9);
        });
        it("scales the score by the response weight", function () {
            var response_topics = [{keyword:"atopic", weight: 0.8}],
                topics = [{keyword:"atopic"}],
                score = rifResponseCore.computeScore({matches: response_topics, weights: "0.6"}, topics, 'responder', world);
            expect(score).toEqual(0.6*0.8);
        });
    });

    describe("responseIsEligible", function () {
        var world;
        beforeEach(function () {
            world = {
                runs: { },
                getResponseRuns : function(id) {
                    return this.runs[id] || 0;
                },
                setResponseRuns : function(id, runs) {
                    this.runs[id] = runs;
                },
                getState: jasmine.createSpy('getState').andCallFake(function(id, responder) {
                    return parseFloat(id);
                })
            };
        });

        it("returns true for a simple response", function () {
            expect(rifResponseCore.responseIsEligible({}, [], "aresponder", world)).toEqual(true);
        });
        it('gets its run count from the world if not yet set', function() {
            world.setResponseRuns(1, 3);
            var response = { id: 1 };
            rifResponseCore.responseIsEligible(response, [], "aresponder", world);
            expect(response.run).toBe(3);
        });
        it('does not get its run count from the world if already set', function() {
            world.setResponseRuns(1, 3);
            var response = { run: 5, id: 1 };
            rifResponseCore.responseIsEligible(response, [], "aresponder", world);
            expect(response.run).toBe(5);
        });
        it("returns false if the run equals or exceeds its occurs count", function () {
            var response = { run: 5, occurs: 5 };
            expect(rifResponseCore.responseIsEligible(response, [], "aresponder", world)).toEqual(false);
        });
        it("returns false if required state is not set", function () {
            world.getState = function(id) { return false; };
            var response = { needs: ["somestate"] };
            expect(rifResponseCore.responseIsEligible(response, [], "aresponder", world)).toEqual(false);
        });
        it("returns false if disallowed state is set", function () {
            world.getState = function(id) { return true; };
            var response = { needs: ["!somestate"] };
            expect(rifResponseCore.responseIsEligible(response, [], "aresponder", world)).toEqual(true);
        });
        it("returns correct value for multiple states", function () {
            world.getState = function(id) { return true; };
            var response = { needs: ["somestate", "!someotherstate"] };
            expect(rifResponseCore.responseIsEligible(response, [], "aresponder", world)).toEqual(true);
        });
        it("returns false if required topics are not present", function () {
            var response = { matches: [{keyword: "*atopic"}] };
            expect(rifResponseCore.responseIsEligible(response, [{keyword: "btopics"}], 'aresponder', world)).toEqual(false);
        });
        it("returns false if topics score is not positive", function () {
            var response = { matches: [{keyword: "atopic"}] };
            expect(rifResponseCore.responseIsEligible(response, [{keyword: "btopics"}], 'aresponder', world)).toEqual(false);
        });
        it("passes the responder as state prefix if passed", function () {
            world.getState = function(id, responder) { return id === "somestate" && responder === "aresponder"; };
            var response = { needs: ["somestate"] };
            expect(rifResponseCore.responseIsEligible(response, [], "aresponder", world)).toEqual(true);
        });
        it("passes the responder as state prefix if passed (negative)", function () {
            world.getState = function(id, responder) { return id === "!somestate" && responder === "aresponder"; };
            var response = { needs: ["!somestate"] };
            expect(rifResponseCore.responseIsEligible(response, [], "aresponder", world)).toEqual(true);
        });
        it('properly works with response weights', function() {
            var response = { weights: '0.5' };
            expect(rifResponseCore.responseIsEligible(response, [], "aresponder", world)).toEqual(true);
        });
    });
});
