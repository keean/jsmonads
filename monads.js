//------------------------------------------------------------------------
// Polymorphic functions

var id = function(x) {return x};

var app = function(a) {return function(b) {return a(b);};};

var rev = function(a) {return function(b) {return b(a);};};

var dot = function(a) {return function(b) {return function(c) {return a(b(c));}}};

//  class Monoid where
//      zero :: a
//      plus :: a -> a -> a
//
var monoid = {
    zero: function() {
        return pointed.unit();
    },
    plus: function(m) {
        return function (n) {
            return m.plus(n);
        }
    }
};

//  class Functor f where
//      fmap :: (a -> b) -> f a -> f b
//
var functor = {
    fmap: function(a) {
        return function(f) {
            return f.fmap(a);
        }
    }
};

// class Pointed f where
//      unit :: a -> f a
//
var pointed = {
    unit: function(f) {
        return function(a) {
            return f.unit(a);
        };
    }
};

// class Copointed f where
//      extract :: f a -> a
//
var copointed = {
    extract: function(m) {
        return m.extract();
    }
};

//  class Applicative f where
//      product :: f (a -> b) -> f a -> f b
//
var applicative = {
    product: function(f) {
        return function(a) {
            return f.product(a);
        };
    }
};

//  class Monad m where
//      bind :: m a -> (a -> m b) -> m b
//
var monad = {
    bind: function(m) {
        return function(f) {
            return m.bind(f);
        }
    },
};

//  class Comonad w where
//      extend :: w a -> (w a -> b) -> w b
//
var comonad = {
    extend: function(m) {
        return function(f) {
            return m.extend(f);
        }
    },
};

//  class MonadError m where
//      fail :: e -> m a
//      trap :: m a -> (e -> m a) -> m a
var monad_error = {
    fail: function(m) {
        return function(e) {
            return m.fail(e);
        };
    },
    trap: function(m) {
        return function(t) {
            return m.trap(t);
        };
    }
};

//  class MonadCont m where
//      callcc :: ((a -> (forall b. m b)) -> m a) -> m a
//
var monad_cont = {
    callcc: function(m) {
        return function(f) {
            return m.callcc(f);
        }
    }
};

//------------------------------------------------------------------------
// Identity Monad

var Identity = function(x) {
    this.exec = function() {return x};
};

// Functor
Identity.prototype.fmap = function(a) { 
    return new Identity(a(this.exec()));
};

// Functor => Pointed
Identity.unit = function(a) {
    return new Identity(a);
};

// Functor => Copointed
Identity.prototype.extract = function() {
    return this.exec();
};

// Pointed => Applicative

Identity.prototype.product = function(a) {
    return new Identity(this.exec()(a.exec()));
};

// Applicative => Monad

Identity.prototype.bind = function(a) {
    return a(this.exec());
};

// Copointed => Comonad
Identity.prototype.extend = function(a) {
    return new Identity(a(this));
};

//------------------------------------------------------------------------
// Maybe Monad

var Maybe = function(x) {
    this.exec = function() {return x};
};

Maybe.prototype.exec = function() {
    return this.exec();
};

// Functor
Maybe.prototype.fmap = function(a) {
    var x = this.exec();
    return (x === undefined) ? this : new Maybe(a(x));
};

// Functor => Pointed
Maybe.unit = function(a) {
    return new Maybe(a);
};

// Functor => Copointed
Maybe.prototype.extract = function() {
    return this.exec();
};

// Pointed => Applicative
Maybe.prototype.product = function(a) {
    return (this.exec() === undefined) ? this : ((a.exec() === undefined) ? a : new Maybe(this.exec()(a.exec())))
};

// Applicative => Monad
Maybe.prototype.bind = function(a) {
    var x = this.exec();
    return (x === undefined) ? this : a(x);
};

// Monoid, Applicative => Alternative, Monad => MonadZero
Maybe.zero = function() {
    return new Maybe(undefined);
};

// Monoid, Applicative => Alternative, Monad => MonadPlus
Maybe.prototype.plus = function(a) {
    return (this.exec() === undefined) ? a : this;
};

//------------------------------------------------------------------------
// Either Monad

var Either = function(left, x) {
    this.left = function() {return left}; 
    this.exec = function() {return x};
};

Either.prototype.exec = function() {
    return this.exec();
};

// Functor
Either.prototype.fmap = function(a) {
    return this.left() ? this : new Either(false, a(this.exec()));
};

// Functor => Pointed
Either.unit = function(a) {
    return new Either(false, a);
};

// Functor => Copointed
Either.prototype.extract = function() {
    return this.exec();
};

// Pointed => Applicative
Either.prototype.product = function(a) {
    return this.left() ? this : (a.left() ? a : new Either(false, this.exec()(a.exec())));
};

// Applicative => Monad
Either.prototype.bind = function(a) {
    return this.left() ? this : a(this.exec());
};

// Monoid, Applicative => Alternative, Monad => MonadZero
Either.zero = function() {
    return new Either(true, undefined);
};

// Monoid, Applicative => Alternative, Monad => MonadPlus
Either.prototype.plus = function(a) {
    return this.left() ? a : this;
};

// Monad => MonadError
Either.prototype.fail = function(a) {
    return new Either(true, a);
};

// Monad => MonadError
Either.prototype.trap = function(a) {
    return this.left() ? a(this.exec()) : this;
};

//------------------------------------------------------------------------
// List Monad

var List = function(x) {
    this.unbox = function() {return x};
}

List.prototype.exec = function() {
    return this.unbox();
};

// Functor
List.prototype.fmap = function(a) {
    var x = this.unbox();
    var y = [];
    for (var i = 0; i < x.length; i++) {
        y.push(a(x[i]));
    }
    return new List(y);
};

// Functor => Pointed
List.unit = function(a) {
    return new List([a]);
};

// Functor => Copointed
List.prototype.extract = function() {
    return this.unbox()[0];
};

// Pointed => Applicative
List.prototype.product = function(a) {
    var x = this.unbox();
    var y = a.unbox();
    var z = [];
    for (var j = 0; j < x.length; j++) {
        for (var i = 0; i < y.length; i++) {
            z.push(x[j](y[i]));
        }
    }
    return new List(z);
};

List.prototype.join = function() {
    var x = this.unbox();
    var y = [];
    for (var i = 0; i < x.length; i++) {
        var xi = x[i];
        if (xi.length !== undefined) {
            y.concat(xi);
        } else {
            y.push(xi);
        }
    }
    return new List(y);
};

// Applicative => Monad
List.prototype.bind = function(a) {
    return this.join(this.fmap(a));
};

// Monoid, Applicative => Alternative, Monad => MonadZero
List.zero = function() {
    return new List([]);
};

// Monoid, Applicative => Alternative, Monad => MonadPlus
List.prototype.plus = function(a) {
    return new List(this.unbox().concat(a.unbox()));
};
    
// Copointed => Comonad
List.prototype.extend = function(a) {
    var x = this.unbox();
    var y = [];
    for(var i = 0; i < x.length; i++) {
        y.push(a(new List(x.slice(i))));
    }
    return new List(y);
};

//------------------------------------------------------------------------
// Continuation Monad
//
// implements: functor monad monad_cont 

/*
var continuation = function(value) {
    return {
        run: function(k) {
            return value(k || id);
        },

        fmap: function(f) {
            value = (function(v) {
                return function(k) {
                    return v(function(a) {
                        return k(f(a));
                    });
                };
            })(value);
            return this;
        },

        unit: function(u) {
            value = function(k) {return k(u);};
            return this;
        },
        bind: function(f) { 
            value = (function(v) {
                return function(k) {
                    return v(function(a) {
                        return f(a).run(k);
                    });
                };
            })(value);
            return this;
        },

        callcc: function(f) {
            value = function(k) {
                return f(k).run(k);
            };
            return this;
        },
        shift: function(e) {
            value = function(k) {
                return e(function(a) {
                    return this.unit(k(a));
                }).run(id);
            };
        },
        reset: function(e) {
            return e.run(id);
        }
    };
};
*/

