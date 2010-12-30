//------------------------------------------------------------------------
// Polymorphic functions

var id = function(x) {return x};

//  class Functor m where
//      fmap :: (a -> b) -> f a -> f b
//
var functor = {
    fmap: function(m) {
        return function(f) {
            return m.fmap(f);
        }
    }
};

//  class Monad m where
//      unit :: a -> m a
//      bind :: m a -> (a -> m b) -> m b
//
var monad = {
    bind: function(m) {
        return function(f) {
            return m.bind(f);
        }
    },
    join: function(m) {
        return function(n) {
            return m.join(n);
        }
    }
};

//  class Comonad w where
//      extract :: w a -> a
//      extend :: w a -> (w a -> b) -> w b
//
var comonad = {
    extend: function(m) {
        return function(f) {
            return m.extend(f);
        }
    },
    extract: function(m) {
        return m.extract();
    }
};

//  class MonadPlus m where
//      zero :: m a
//      plus :: m a -> m a -> m a
//
var monad_plus = {
    zero: function() {
        return monad.unit();
    },
    plus: function(m) {
        return function (n) {
            return m.plus(n);
        }
    }
};

//  class MonadCont where
//      callcc :: ((a -> (forall b. m b)) -> m a) -> m a
//
var monad_cont = {
    callcc: function(m) {
        return function (f) {
            return m.callcc(f);
        }
    }
};

//------------------------------------------------------------------------
// Identity Monad
//
// implements: functor monad comonad

var identity = function(value) {
    return {
        run: function() {
            return value;
        },

        fmap: function(f) {
            value = f(value);
            return this;
        },

        unit: function(v) {
            value = v;
            return this;
        },
        bind: function(f) {
            return f(value);
        },

        extract: function() {
            return value;
        },
        extend: function(f) {
            value = f(this);
            return this;
        }
    };
};

identity.unit = identity;

//------------------------------------------------------------------------
// Maybe Monad: note unit() is used for zero.
//
// implements: functor monad monad_plus

var maybe = function(value) {
    return {
        run: function() {
            return value;
        },

        fmap: function(f) {
            if (value !== undefined) {value = f(value);}
            return this;
        },

        unit: function(v) {
            value = v;
            return this;
        },
        bind: function(f) {
            if (value !== undefined) {return f(value);} 
            return this;
        },


        zero: function() {
            value = undefined;
            return this;
        },
        plus: function(m) {
            if (value !== undefined) {return this;}
            return m;
        }
    };
};

maybe.unit = maybe;

//------------------------------------------------------------------------
// Either Monad
//
// implements: functor monad monad_plus

var either = function(is_right, value) {
    return {
        run: function() {
            return {is_right:is_right, value:value};
        },

        fmap: function(f) {
            if (is_right) {value = f(value);}
            return this;
        },

        unit: function(v) {
            is_right = (v !== undefined);
            value = v;
            return this;
        },
        bind: function(f) {
            return is_right ? f(value) : this;
        },

        zero: function() {
            is_right = false;
            value = undefined;
            return this;
        },
        plus: function(m) {
            return is_right ? this : m;
        }
    };
};

either.unit = function(v) {return either(v !== undefined, v);};

//------------------------------------------------------------------------
// List Monad
//
// implements: functor monad comonad monad_plus

var list = function(value) {
    return {
        run: function() {
            return value;
        },

        fmap: function(f) {
            for (var i = 0; i < value.length; i++) {
                value[i] = f(value[i]);
            }
            return this;
        },

        unit: function(u) {
            value = (u === undefined) ? [] : [u];
            return this;
        },
        bind: function(f) {
            var new_value = [];
            for (var i = 0; i < value.length; i++) {
                f(value[i]).bind(function(x) {
                    new_value = new_value.concat(x);
                    return list([]);
                });
            }
            value = new_value;
            return this;
        },

        extract: function() {
            return value[0];
        },
        extend: function(f) {
            var new_value = [];
            var l = value.length;
            for(var i = 0; i < l; i++) {
                new_value.push(f(this));
                value.pop();
            }
            value = new_value;
            return this;
        },

        zero: function() {
            value = [];
            return this;
        },
        plus: function(m) {
            m.bind(function(x) {
                value = value.concat(x);
                return list([]);
            });
            return this;
        }
    };
};

list.unit = function(v) {return list((v === undefined) ? [] : [v]);};

//------------------------------------------------------------------------
// Continuation Monad
//
// implements: functor monad monad_cont 

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

continuation.unit = function(u) {return continuation(function(k) {return k(u);});};

