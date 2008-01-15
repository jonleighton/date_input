function DateInput(el) {
  this.input = $(el);
  this.bindMethodsToObj("show", "hide", "hideIfClickOutside", "selectDate", "prevMonth", "nextMonth");
  
  this.build();
  this.selectDate();
  this.hide();
};
DateInput.MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
DateInput.SHORT_MONTH_NAMES = $.map(DateInput.MONTH_NAMES, function(month) { return month.substr(0, 3) });
DateInput.SHORT_DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
DateInput.prototype = {
  build: function() {
    this.monthNameSpan = $('<span class="month_name"></span>');
    var monthNav = $('<p class="month_nav"></p>').append(
      $('<a href="#" class="prev">&laquo;</a>').click(this.prevMonth),
      " ", this.monthNameSpan, " ",
      $('<a href="#" class="next">&raquo;</a>').click(this.nextMonth)
    );
    
    var tableShell = "<table><thead><tr>";
    $(DateInput.SHORT_DAY_NAMES).each(function() {
      tableShell += "<th>" + this + "</th>";
    });
    tableShell += "</tr></thead><tbody></tbody></table>";
    
    this.dateSelector = this.rootLayers = $('<div class="date_selector"></div>')
      .css({ display: "none", position: "absolute", zIndex: 100 })
      .append(monthNav, tableShell)
      .appendTo(document.body);
    
    if ($.browser.msie && $.browser.version < 7) {
      this.ieframe = $('<iframe class="date_selector_ieframe" frameborder="0" src="#"></iframe>')
        .css({ position: "absolute", display: "none", zIndex: 99 })
        .insertBefore(this.dateSelector);
      this.rootLayers = this.rootLayers.add(this.ieframe);
    };
    
    this.tbody = $("tbody", this.dateSelector);
    
    // The anon function ensures the event is discarded
    this.input.change(this.bindToObj(function() { this.selectDate(); }));
  },
  
  selectMonth: function(date) {
    this.currentMonth = date;
    
    var rangeStart = this.rangeStart(date), rangeEnd = this.rangeEnd(date);
    var numDays = this.daysBetween(rangeStart, rangeEnd);
    var dayCells = "";
    
    for (var i = 0; i <= numDays; i++) {
      var currentDay = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + i);
      
      if (currentDay.getDay() == 1) dayCells += "<tr>"; // Monday
      
      if (currentDay.getMonth() == date.getMonth()) {
        dayCells += '<td date="' + this.dateToString(currentDay) + '"><a href="#">' + currentDay.getDate() + '</a></td>';
      } else {
        dayCells += '<td class="unselected_month" date="' + this.dateToString(currentDay) + '">' + currentDay.getDate() + '</td>';
      };
      
      if (currentDay.getDay() == 0) dayCells += "</tr>"; // Sunday
    };
    
    this.monthNameSpan.empty().append(this.monthName(date) + " " + date.getFullYear());
    this.tbody.empty().append(dayCells);
    
    $("a", this.tbody).click(this.bindToObj(function(event) {
      this.selectDate(new Date($(event.target).parent().attr("date")));
      this.hide();
      return false;
    }));
    
    $("td[date=" + this.dateToString(new Date()) + "]", this.tbody).addClass("today");
  },
  
  selectDate: function(date) {
    if (typeof(date) == "undefined") {
      date = this.stringToDate(this.input.val());
    };
    
    if (date) {
      this.selectedDate = date;
      this.selectMonth(date);
      $('td[date=' + this.dateToString(date) + ']', this.tbody).addClass("selected");
      this.input.val(this.dateToString(date));
    } else {
      this.selectMonth(new Date());
    };
  },
  
  show: function() {
    this.setPosition();
    this.rootLayers.css("display", "block");
    this.input.unbind("focus", this.show);
    $(document.body).click(this.hideIfClickOutside);
  },
  
  hide: function() {
    this.rootLayers.css("display", "none");
    $(document.body).unbind("click", this.hideIfClickOutside);
    this.input.focus(this.show);
  },
  
  hideIfClickOutside: function(event) {
    if (event.target != this.input[0] && !this.insideSelector(event)) {
      this.hide();
    };
  },
  
  stringToDate: function(string) {
    var matches;
    if (matches = string.match(/^(\d{1,2}) ([A-Z][a-z]{2,2}) (\d{4,4})$/)) {
      return new Date(matches[3], this.shortMonthNum(matches[2]), matches[1]);
    } else {
      return null;
    };
  },
  
  dateToString: function(date) {
    return date.getDate() + " " + DateInput.SHORT_MONTH_NAMES[date.getMonth()] + " " + date.getFullYear();
  },
  
  setPosition: function() {
    var offset = this.input.offset();
    this.rootLayers.css({
      top: offset.top + this.input.outerHeight(),
      left: offset.left
    });
    
    if (this.ieframe) {
      this.ieframe.css({
        width: this.dateSelector.outerWidth(),
        height: this.dateSelector.outerHeight()
      });
    };
  },
  
  moveMonthBy: function(amount) {
    this.selectMonth(new Date(this.currentMonth.setMonth(this.currentMonth.getMonth() + amount)));
  },
  
  prevMonth: function() {
    this.moveMonthBy(-1);
    return false;
  },
  
  nextMonth: function() {
    this.moveMonthBy(1);
    return false;
  },
  
  monthName: function(date) {
    return DateInput.MONTH_NAMES[date.getMonth()];
  },
  
  insideSelector: function(event) {
    var offset = this.dateSelector.offset();
    offset.right = offset.left + this.dateSelector.outerWidth();
    offset.bottom = offset.top + this.dateSelector.outerHeight();
    
    return event.pageY < offset.bottom &&
           event.pageY > offset.top &&
           event.pageX < offset.right &&
           event.pageX > offset.left;
  },
  
  bindToObj: function(fn) {
    var self = this;
    return function() { return fn.apply(self, arguments) };
  },
  
  bindMethodsToObj: function() {
    for (var i = 0; i < arguments.length; i++) {
      this[arguments[i]] = this.bindToObj(this[arguments[i]]);
    };
  },
  
  shortMonthNum: function(month_name) {
    for (var i = 0; i < DateInput.SHORT_MONTH_NAMES.length; i++) {
      if (month_name == DateInput.SHORT_MONTH_NAMES[i]) {
        return i;
      };
    };
  },
  
  shortDayNum: function(day_name) {
    for (var i = 0; i < DateInput.SHORT_DAY_NAMES.length; i++) {
      if (day_name == DateInput.SHORT_DAY_NAMES[i]) {
        return i;
      };
    };
  },
  
  daysBetween: function(start, end) {
    start = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    end = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return (end - start) / 86400000;
  },
  
  changeDayTo: function(to, date, dayChange) {
    var curDay = date.getDay() == 0 ? 6 : date.getDay() - 1;
    var difference = dayChange * Math.abs(curDay - this.shortDayNum(to));
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + difference);
  },
  
  rangeStart: function(date) {
    return this.changeDayTo("Mon", new Date(date.getFullYear(), date.getMonth()), -1);
  },
  
  rangeEnd: function(date) {
    return this.changeDayTo("Sun", new Date(date.getFullYear(), date.getMonth() + 1, 0), 1);
  }
};

(function($) {
  $.fn.date_input = function() {
    return this.each(function() { new DateInput(this); });
  };
  $.date_input = { initialize: function() {
    $("input.date_input").date_input();
  } };
})(jQuery);
