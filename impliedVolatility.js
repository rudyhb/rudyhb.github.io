
var impliedVolatility = function(isAmerican, isCall, futurePrice, strikePrice, timeToExp, rfRate, optionPrice) {

    return getVol(isAmerican, isCall, futurePrice, strikePrice, timeToExp, rfRate, optionPrice);


    // getVol - get implied volatility for American and European Options
    //
    //isAmerican - 0 for European options, 1 for American options
    //isCall - 0 for Put, 1 for Call
    //futurePrice - current Futures price
    //strikePrice - current strike price
    //timeToExp - time to expiry (years)
    //rfRate - risk-free rate
    //optionPrice - current option price
    //
    //
    function getVol(isAmerican, isCall, futurePrice, strikePrice, timeToExp, rfRate, optionPrice) {
    	if (isAmerican == 1) return impliedVolWhaley(isCall, futurePrice, strikePrice, timeToExp, rfRate, optionPrice);
    	return impliedBSVolatility(isCall, futurePrice, strikePrice, timeToExp, rfRate, optionPrice);
    }


    //isCall - 0 for Put, 1 for Call
    //S - current Futures price
    //K - current strike price
    //T - time to expiry (years)
    //r - risk-free rate
    //cm - current option price
    //
    // Implied Whaley Volatility - for American Options
    function impliedVolWhaley(isCall, S, K, T, r, cm) {

        var epsilon = 0.00000001;
        var vi;
        var ci;
        var vegai;
        var minDiff;
        var vshift = 0.01;

        // Manaster and Koehler seed value
        vi = Math.sqrt(Math.abs(Math.log(S / K) + r * T) * 2 / T);
        ci = GetOptionValue(S, K, 0.0, r, vi, T, isCall);
        vegai = VegaFDM(S, K, r, vi, T, vshift, isCall);
        minDiff = Math.abs(cm - ci);

        var count = 1000;
        while (minDiff >= epsilon & count >= 0)
        {
            vi -= (ci - cm) / vegai;
            ci = GetOptionValue(S, K, 0.0, r, vi, T, isCall);
            vegai = VegaFDM(S, K, r, vi, T, vshift, isCall);
            minDiff = Math.abs(cm - ci);
            count -= 1;
        }

        if (minDiff < epsilon)
        {
            return vi;
        }
        else
        {
            return 0;
        }

    }

    // Implied Black Scholes Volatility - for European Options
    function impliedBSVolatility(isCall, S, K, t, r, optionPrice) {

    	var accuracy = 1e-3;
    	var maxIterations = 1000;
    	var q = 0.0;

        if (optionPrice < 0.99 * (S - X * Math.exp(-r * t)))
            return 0.0;
        var t_sqrt = Math.sqrt(t);
        var sigma = optionPrice / S / 0.398 / t_sqrt;
        for (var i = 0; i < maxIterations; i++)
        {
            var price = BSPrice(S, X, q, r, sigma, t, isCall);
            var diff = optionPrice - price;
            if (Math.abs(diff) < accuracy)
                return sigma;
            var vega = GetVega(S, X, q, r, sigma, t, isCall);
            sigma = sigma + diff / vega;
        }
        return sigma;	

    }


    function GetOptionValue(S, X, q, r, sigma, t, isCall) {
        if (r == 0)
            r = r + 1e-10;
        if (q == 0)
            q = q + 1e-10;

        if (isCall == 1) {
        	return GetCallOption(S, X, q, r, sigma, t);
        } else {
        	return GetPutOption(S, X, q, r, sigma, t);
        }
    }

    function GetCallOption(S, X, q, r, sigma, t) {
    	
        var b = r - q;
        var t_sqrt = Math.sqrt(t);
        var sigma2 = sigma * sigma;

        if (q == 0)
            return BSPrice(S, X, q, r, sigma, t, 1);

        var K = 1.0 - Math.exp(-r * t);
        var N = 2.0 * b / sigma2;
        var M = 2.0 * r / sigma2;
        var q2 = 0.5 * (1.0 - N + Math.sqrt((N - 1.0) * (N - 1.0) + 4.0 * M / K));

        var q2_inf = 0.5 * (1.0 - N + Math.sqrt((N - 1.0) * (N - 1.0) + 4.0 * M));
        var S_star_inf = X / (1.0 - 1.0 / q2_inf);
        var h2 = -(b * t + 2.0 * sigma * t_sqrt) * (X / (S_star_inf - X));
        var S_seed = X + (S_star_inf - X) * (1.0 - Math.exp(h2));

        var S2 = SolveS2(X, q, r, q2, sigma, t, 1e-6, 500, S_seed, 1);

        var d1 = (Math.log(S2 / X) + (b + sigma2 / 2) * t) / (t_sqrt * sigma);
        var A2 = S2 / q2 * (1 - Math.exp((b - r) * t) * Nfun(d1));

        if (S < S2)
            return BSPrice(S, X, q, r, sigma, t, 1) + A2 * Math.pow(S / S2, q2);
        else
            return S - X;

    }

    function GetPutOption(S, X, q, r, sigma, t) {
    	
        var b = r - q;
        var t_sqrt = Math.sqrt(t);
        var sigma2 = sigma * sigma;

        var K = 1.0 - Math.exp(-r * t);
        var N = 2.0 * b / sigma2;
        var M = 2.0 * r / sigma2;
        var q1 = 0.5 * (1.0 - N - Math.sqrt((N - 1.0) * (N - 1.0) + 4.0 * M / K));

        var q1_inf = 0.5 * (1.0 - N - Math.sqrt((N - 1.0) * (N - 1.0) + 4.0 * M));
        var S_star_inf = X / (1.0 - 1.0 / q1_inf);
        var h1 = (b * t - 2.0 * sigma * t_sqrt) * (X / (X - S_star_inf));
        var S_seed = S_star_inf + (X - S_star_inf) * Math.exp(h1);

        var S1 = SolveS1(X, q, r, q1, sigma, t, 1e-6, 500, S_seed, 0);

        var d1 = (Math.log(S1 / X) + (b + sigma2 * 0.5) * t) / (t_sqrt * sigma);
        var A1 = -S1 / q1 * (1 - Math.exp((b - r) * t) * Nfun(-d1));

        if (S > S1)
            return BSPrice(S, X, q, r, sigma, t, 0) + A1 * Math.pow(S / S1, q1);
        else
            return X - S;

    }

    function BSPrice(S, X, q, r, sigma, t, isCall) {
        var t_sqrt = Math.sqrt(t);
        var sigma2 = sigma * sigma;
        var d1 = (Math.log(S / X) + (r - q + sigma2 * 0.5) * t) / (t_sqrt * sigma);
        var d2 = d1 - t_sqrt * sigma;

        if (isCall == 1) {
        	return S * Math.exp(-q * t) * Nfun(d1) - X * Math.exp(-r * t) * Nfun(d2);
        } else {
        	return -S * Math.exp(-q * t) * Nfun(-d1) + X * Math.exp(-r * t) * Nfun(-d2);
        }	
    }

    function SolveS1(X, q, r, q1, sigma, t, accuracy, maxIterations, S_seed, isCall) {
        var b = r - q;
        var t_sqrt = Math.sqrt(t);
        var sigma2 = sigma * sigma;
        var S1 = S_seed;

        for (var i = 1; i < maxIterations; i++)
        {
            var d1 = (Math.log(S1 / X) + (b + sigma2 * 0.5) * t) / (t_sqrt * sigma);
            var n_d1 = nfun(-d1);
            var N_d1 = Nfun(-d1);
            var putBS = BSPrice(S1, X, q, r, sigma, t, isCall);
            var LHS = X - S1;
            var RHS = putBS - (1 - Math.exp((b - r) * t) * N_d1) * S1 / q1;

            var b1 = -Math.exp((b - r) * t) * N_d1 * (1.0 - 1.0 / q1)
                - (1 + Math.exp((b - r) * t) * n_d1 / sigma / t_sqrt) / q1;

            S1 = (X - RHS + b1 * S1) / (1 + b1);

            if (Math.abs(LHS - RHS) / X < accuracy)
                return S1;
        }	
    }

    function SolveS2(X, q, r, q2, sigma, t, accuracy, maxIterations, S_seed, isCall) {
        var b = r - q;
        var t_sqrt = Math.sqrt(t);
        var sigma2 = sigma * sigma;
        var S2 = S_seed;

        for (var i = 1; i < maxIterations; i++)
        {
            var d1 = (Math.log(S2 / X) + (b + sigma2 * 0.5) * t) / (t_sqrt * sigma);
            var n_d1 = nfun(d1);
            var N_d1 = Nfun(d1);
            var callBS = BSPrice(S2, X, q, r, sigma, t, isCall);
            var LHS = S2 - X;
            var RHS = callBS + (1 - Math.exp((b - r) * t) * N_d1) * S2 / q2;
            var b2 = Math.exp((b - r) * t) * N_d1 * (1.0 - 1.0 / q2)
                + (1 - Math.exp((b - r) * t) * n_d1 / sigma / t_sqrt) / q2;

            S2 = (X + RHS - b2 * S2) / (1 - b2);

            if (Math.abs(LHS - RHS) / X < accuracy)
                return S2;
        }
        return S2;	
    }

    function VegaFDM(S, K, r, v, T, vega_S, isCall) {
        var vup = GetOptionValue(S, K, 0.0, r, v + vega_S, T, isCall);
        var vdn = GetOptionValue(S, K, 0.0, r, v , T, isCall);
        return ( vup - vdn )/vega_S;	
    }

    function GetVega(S, X, q, r, sigma, t, isCall) {
        var t_sqrt = Math.sqrt(t);
        var sigma2 = sigma * sigma;
        var d1 = (Math.log(S / X) + (r - q + sigma2 * 0.5) * t) / (t_sqrt * sigma);

        return S * Math.exp(-q * t) * nfun(d1) * t_sqrt;	
    }

    function Nfun(d) {
        /* 
        //Bagby, R. J. "Calculating Normal Probabilities." Amer. Math. Monthly 102, 46-49, 1995          
        double part1 = 7.0*Math.Exp(-d*d/2.0); 
        double part2 = 16.0*Math.Exp(-d*d*(2.0-Math.Sqrt(2.0))); 
        double part3 = (7.0+Math.PI*d*d/4.0)*Math.Exp(-d*d); 
        double cumProb = Math.Sqrt(1.0-(part1+part2+part3)/30.0)/2.0; 
        if(d>0) 
            cumProb = 0.5+cumProb; 
        else 
            cumProb = 0.5-cumProb; 
        return cumProb; 
        */

        if (d > 6.0)
            return 1.0;
        else if (d < -6.0)
            return 0.0;
        var b1 = 0.31938153;
        var b2 = -0.356563782;
        var b3 = 1.781477937;
        var b4 = -1.821255978;
        var b5 = 1.330274429;
        var p = 0.2316419;
        var c2 = 0.3989423;

        var a = Math.abs(d);
        var t = 1.0 / (1.0 + a * p);
        var b = c2 * Math.exp((-d) * (d * 0.5));
        var n = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;
        n = 1.0 - b * n;
        if (d < 0)
            n = 1.0 - n;
        return n;	
    }

    function nfun(d) {
    	return 1.0 / Math.sqrt(2.0 * Math.PI) * Math.exp(-d * d * 0.5);
    }

}