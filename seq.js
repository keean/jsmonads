//------------------------------------------------------------------------
// Monadic Event Sequencing using ErrorContinuation Monad

var seq = function() {
    var a = arguments;
    return function() {
        var l = a.length;
        var m = a[0].apply(m, arguments);
        for (var i = 1; i < l; i++) {
            m = m.bind(a[i]);
        }
        return m;
    };
};

var Seq = function(x) {
    this.run = function(sk ,ek) {return x(sk, ek);};
}

Seq.prototype.unbox = function() {
    return this.run(id, id);   
}

// Functor
Seq.prototype.fmap = function(f) {
    var m = this;
    return new Seq(function(sk, ek) {
        return m.run(function() {
            return sk.call(m, f.apply(m, arguments));
        }, ek);
    });
};

// Functor => Pointed
Seq.unit = function() {
    var m = this, a = arguments;
    return new Seq(function(sk, ek) {
        return sk.apply(m, a);
    });
};

// Pointed => Applicative
Seq.prototype.product = function(f) {
    var m = this;
    return new Seq(function(sk, ek) {
        return m.run(function(a) {
            return f.run(function() {
                return sk.call(m, a.apply(m, arguments));
            }, ek);
        }, ek);
    });
};

// Applicative => Monad
Seq.prototype.bind = function(f) {
    var m = this;
    return new Seq(function(sk, ek) {
        return m.run(function() {
            return f.apply(m, arguments).run(sk, ek);
        }, ek);
    });
};

// Monoid, Applicative => Alternative, Monad => MonadZero
Seq.zero = function() {
    var m = this;
    return new Seq(function(sk, ek) {
        return ek.apply(m);
    });
};

// Monoid, Applicative => Alternative, Monad => MonadPlus
Seq.prototype.plus = function(f) {
    var m = this;
    return new Seq(function(sk, ek) {
        return m.run(sk, function() {
            return f.run(sk, ek);
        });
    });
};

// Monad => Error
Seq.fail = function() {
    var m = this, a = arguments;
    return new Seq(function(sk, ek) {
        return ek.apply(m, a);
    });
};

// Monad => Error
Seq.prototype.trap = function(f) {
    var m = this;
    return new Seq(function(sk, ek) {
        return m.run(sk, function() {
            return f.apply(m, arguments).run(sk, ek);
        });
    })
};

