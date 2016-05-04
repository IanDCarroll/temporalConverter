/* solar & lunar calculator
 * this code returns the Chinese calendar year and month.
 *    1. The new moon in ms relative to UTC 1/1/1970 00:00:00:000
 *    2. The 24 solar terms of CCT as above.
 * this data can then be passed to TempConV2.js to calculate the year, 
 * month, xun, and day along with any intercalary months, and whether those 
 * months are long (30 days) or short (29)
 *
 * Avg Synodic Month  = 	   2551442802 ms
 * Mean Tropical Year = 	  31556925000 ms
 * ms to next great Solar Term =   2629743750 ms
 * ms to next Solar Term = 	   1314871875 ms
 *
 * Closest Winter Solstice to      UTC 1/1/1970 00:00:000 = 
 *	UTC 22/12/1969 00:44:000 = -861360000 ms
 * Closest New Moon to 		   UTC 1/1/1970 00:00:000 =
 *	UTC 07/01/1970 20:35:000 =  592500000 ms
 *
 * FEAR: Avg and Mean times may not be accurate enough, but what to do about
 * chaotic perturbations in the orbits of the celestial bodies? :/
 *
 * New Year = 2nd New Moon after winter Solstice
 * New Year starts at 23:00:000 because CC Days start then 
 * (unless Daylight savings, then its 00:00:000 again)
 */

//todo: remember Chinese days start at UTC -1 Hours! 
//Make sure to account for it! (first func: ms + 1 hr)
//todo: retool functions so they can handle dates before 1970.
//Haven't decided when to truncate raw ms into dayOf ms etc.

//constants:
var zHOffset =   -3600000,
    wSOffset = -861360000,
    nMOffset =  592500000,
    day     =    86400000,
    mTropYr = 31556925000,
    synodMo =  2551442802,
    SolTerm = mTropYr / 24,
    majSTrm = mTropYr / 12;

//gets the ms useable time of the start of the last CC day, at 23:00 UTC
function getDayLast(ms) {
    var dayLast = Math.floor((ms - zHOffset) / day) * day;
    return dayLast;
}

//returns the ms useable time of the most recent winter solstice 
function getWinterLast(ms) {
    var winterlast = Math.floor((ms - wSOffset) / mTropYr) * mTropYr;
    return winterLast; 
}

//returns the most recent new moon
function getMoonLast(ms) {
    var moonLast = Math.floor((ms - nMOffset) / synodMo) * synodMo;
    return moonLast;
}

//gets the ms usable date of the last major solar term.
function getMSTLast(ms) {
    var mSTLast = Math.floor((ms - wSOffset) / majSTrm) * majSTrm;
    return mSTLast;
}

//returns the starting time (ms) for the last chinese new year
//the starting point for the Chinese Date
function getYearLast(ms) {
	//gets the # of months since 1970.
    var moonNum = Math.floor((ms - nMOffset) / synodMo),
	//a counter for the loop
	moonCount = getMoonLast(ms) + synodMo,
	//an important piece of the puzzle to get CCC 1/1
	moonFrag = 0,
	//ms precise start of newest new year.
	rawYearLast = 0,
	//more useful day precise start of new year.
	yearLast = 0;

    for (var i = 0; i < moonNum; i++) {
	if (moonCount < (getWinterLast(ms) + synodMo)) {
	    moonFrag = moonCount - getWinterLast(ms);
	    break;
	} else {
	    moonCount -= synodMo;
	}
    }

    //Chinese new year is the 2nd new moon after the winter solstice
    rawYearLast = getWinterLast(ms) + moonFrag + synodMo;
    //the day this point in time occurs - New Year's Day, Zi Hour: 00 Ke.
    yearLast = getDayLast(rawYearLast);
    return yearLast; 
}

//todo: make month not count from the artificial start of day.
//returns the CC month
function getMonth(ms) {
    var moonNum = Math.ceil((ms - getYearLast(ms)) / synodMo);

	moonNext = getMoonLast(ms) + synodMo,
	mSTLast = getMSTLast(moonNext),

	month = moonNum,
	monthAry = [];

    //tests if it's the first month
    if (moonNum) {
	for (var i = 0; i < moonNum; i++) {
	    //tests if it's a run (intercalary) month
	    if (moonNext - mSTLast > synodMo) {
	        monthAry.unshift("run" + month);
		moonNext -= synodMo;
	    } else {
	        month -= 1;
		monthAry.unshift(month);
		moonNext -= synodMo;
	    }
	}
    } else {
	monthAry.push(month);
    }

    return monthAry.pop();
}

//returns the CC day of the month.
//worry: should getMoonLast be day-truncated in this case?
function getDay(ms) {
    var dayOfMonth = Math.ceil((ms - getMoonLast(ms)) / day);
    return dayOfMonth;
}

//returns the CC "week" which is 10 or 9 days long depending.
//only the lower xun is ever 9 in the case of a 29 day month.
function getXun(ms) {
    var xunNum = Math.ceil(getDay(ms) / 10),
	xun = "";
    switch (xunNum) {
	case 1:
	    xun = "Upper Xun";
	    break;
	case 2:
	    xun = "Middle Xun";
	    break;
	default:
	    xun = "Lower Xun";
	    break;
    }
    return xun;
}
