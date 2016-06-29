var util = require('../../util');
var stack = require('../Stack');
var RangeItem = require('./item/RangeItem');

/**
 * @constructor Group
 * @param {Number | String} groupId
 * @param {Object} data
 * @param {ItemSet} itemSet
 */
function Group (groupId, data, itemSet) {
  this.groupId = groupId;
  this.subgroups = {};
  this.subgroupIndex = 0;
  this.subgroupOrderer = data && data.subgroupOrder;
  this.itemSet = itemSet;

  this.dom = {};
  this.props = {
    leftLabel: {
      width: 0,
      height: 0
    }
  };
  this.className = null;

  this.items = {};        // items filtered by groupId of this group
  this.visibleItems = []; // items currently visible in window
  this.orderedItems = {
    byStart: [],
    byEnd: []
  };
  this.checkRangedItems = false; // needed to refresh the ranged items if the window is programatically changed with NO overlap.
  var me = this;
  this.itemSet.body.emitter.on("checkRangedItems", function () {
    me.checkRangedItems = true;
  })

  this._create();

  this.setData(data);
}

/**
 * Create DOM elements for the group
 * @private
 */
Group.prototype._create = function() {
  var leftLabel = document.createElement('div');
  var rightCenterOneLabel = document.createElement('div');
  var rightCenterTwoLabel = document.createElement('div');

  if (this.itemSet.options.groupEditable.order) {
	    leftLabel.className = 'vis-label draggable';
      rightCenterOneLabel.className = 'vis-label draggable';
      rightCenterTwoLabel.className = 'vis-label draggable';
  } else {
	    leftLabel.className = 'vis-label';
      rightCenterOneLabel.className = 'vis-label';
      rightCenterTwoLabel.className = 'vis-label';
  }
  this.dom.leftLabel = leftLabel;
  this.dom.rightCenterOneLabel = rightCenterOneLabel;
  this.dom.rightCenterTwoLabel = rightCenterTwoLabel;

  var leftInner = document.createElement('div');
  var rightCenterOne = document.createElement('div');
  var rightCenterTwo = document.createElement('div');
  leftInner.className = 'vis-inner';
  rightCenterOne.className = 'vis-inner';
  rightCenterTwo.className = 'vis-inner';

  leftLabel.appendChild(leftInner);
  rightCenterOneLabel.appendChild(rightCenterOne);
  rightCenterTwoLabel.appendChild(rightCenterTwo);
  this.dom.leftInner = leftInner;
  this.dom.rightCenterOne = rightCenterOne;
  this.dom.rightCenterTwo = rightCenterTwo;


  var foreground = document.createElement('div');
  foreground.className = 'vis-group';
  foreground['timeline-group'] = this;
  this.dom.foreground = foreground;

  this.dom.background = document.createElement('div');
  this.dom.background.className = 'vis-group';

  this.dom.axis = document.createElement('div');
  this.dom.axis.className = 'vis-group';

  // create a hidden marker to detect when the Timelines container is attached
  // to the DOM, or the style of a parent of the Timeline is changed from
  // display:none is changed to visible.
  this.dom.marker = document.createElement('div');
  this.dom.marker.style.visibility = 'hidden';
  this.dom.marker.innerHTML = '?';
  this.dom.background.appendChild(this.dom.marker);
};

/**
 * Set the group data for this group
 * @param {Object} data   Group data, can contain properties content and className
 */
Group.prototype.setData = function(data) {
  // update contents
  var content;
  var rightCenterOneDefaultContent;
  var rightCenterTwoDefaultContent;
  if (this.itemSet.options && this.itemSet.options.groupTemplate) {
    content = this.itemSet.options.groupTemplate(data);
  }
  else {
    content = data && data.content;
    rightCenterOneDefaultContent = 'N/A';
    rightCenterTwoDefaultContent = 'N/A';
  }

  //setting id for the label
    this.dom.rightCenterOne.setAttribute("id", data && "RightCenterOne_" + data.id);
    this.dom.rightCenterTwo.setAttribute("id", data && "RightCenterTwo_" + data.id);


  if (content instanceof Element) {
    this.dom.leftInner.appendChild(content);
    this.dom.rightCenterOne.appendChild(rightCenterOneDefaultContent);
    this.dom.rightCenterTwo.appendChild(rightCenterTwoDefaultContent);

    while (this.dom.leftInner.firstChild) {
      this.dom.leftInner.removeChild(this.dom.leftInner.firstChild);
      this.dom.rightCenterOne.removeChild(this.dom.rightCenterOne.firstChild);
      this.dom.rightCenterTwo.removeChild(this.dom.rightCenterTwo.firstChild);
    }
    this.dom.leftInner.appendChild(content);
    this.dom.rightCenterOne.appendChild(rightCenterOneDefaultContent);
    this.dom.rightCenterTwo.appendChild(rightCenterTwoDefaultContent);
  }
  else if (content !== undefined && content !== null) {
    this.dom.leftInner.innerHTML = content;
    this.dom.rightCenterOne.innerHTML = rightCenterOneDefaultContent;
    this.dom.rightCenterTwo.innerHTML = rightCenterTwoDefaultContent;
  }
  else {
    this.dom.leftInner.innerHTML = this.groupId || ''; // groupId can be null
    this.dom.rightCenterOne.innerHTML = this.groupId || '';
    this.dom.rightCenterTwo.innerHTML = this.groupId || '';
  }

  // update title
  this.dom.leftLabel.title = data && data.title || '';

  if (!this.dom.leftInner.firstChild) {
    util.addClassName(this.dom.leftInner, 'vis-hidden');
  }
  else {
    util.removeClassName(this.dom.leftInner, 'vis-hidden');
    util.removeClassName(this.dom.rightCenterOne, 'vis-hidden');
    util.removeClassName(this.dom.rightCenterTwo, 'vis-hidden');
  }

  // update className
  var className = data && data.className || null;
  if (className != this.className) {
    if (this.className) {
      util.removeClassName(this.dom.leftLabel, this.className);
      util.removeClassName(this.dom.foreground, this.className);
      util.removeClassName(this.dom.background, this.className);
      util.removeClassName(this.dom.axis, this.className);
    }
    util.addClassName(this.dom.leftLabel, className);
    util.addClassName(this.dom.foreground, className);
    util.addClassName(this.dom.background, className);
    util.addClassName(this.dom.axis, className);
    this.className = className;
  }

  // update style
  if (this.style) {
    util.removeCssText(this.dom.leftLabel, this.style);
    util.removeCssText(this.dom.rightCenterOneLabel, this.style);
    util.removeCssText(this.dom.rightCenterTwoLabel, this.style);
    this.style = null;
  }
  if (data && data.style) {
    util.addCssText(this.dom.leftLabel, data.style);
    util.addCssText(this.dom.rightCenterOneLabel, data.style);
    util.addCssText(this.dom.rightCenterTwoLabel, data.style);
    this.style = data.style;
  }
};

/**
 * Get the width of the group label
 * @return {number} width
 */
Group.prototype.getLabelWidth = function() {
  return this.props.leftLabel.width;
};


/**
 * Repaint this group
 * @param {{start: number, end: number}} range
 * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
 * @param {boolean} [restack=false]  Force restacking of all items
 * @return {boolean} Returns true if the group is resized
 */
Group.prototype.redraw = function(range, margin, restack) {
  var resized = false;

  // force recalculation of the height of the items when the marker height changed
  // (due to the Timeline being attached to the DOM or changed from display:none to visible)
  var markerHeight = this.dom.marker.clientHeight;
  if (markerHeight != this.lastMarkerHeight) {
    this.lastMarkerHeight = markerHeight;

    util.forEach(this.items, function (item) {
      item.dirty = true;
      if (item.displayed) item.redraw();
    });

    restack = true;
  }

  // recalculate the height of the subgroups
  this._calculateSubGroupHeights();

  // reposition visible items vertically
  if (typeof this.itemSet.options.order === 'function') {
    // a custom order function

    if (restack) {
      // brute force restack of all items

      // show all items
      var me = this;
      var limitSize = false;
      util.forEach(this.items, function (item) {
        if (!item.displayed) {
          item.redraw();
          me.visibleItems.push(item);
        }
        item.repositionX(limitSize);
      });

      // order all items and force a restacking
      var customOrderedItems = this.orderedItems.byStart.slice().sort(function (a, b) {
        return me.itemSet.options.order(a.data, b.data);
      });
      stack.stack(customOrderedItems, margin, true /* restack=true */);
    }

    this.visibleItems = this._updateVisibleItems(this.orderedItems, this.visibleItems, range);
  }
  else {
    // no custom order function, lazy stacking

    this.visibleItems = this._updateVisibleItems(this.orderedItems, this.visibleItems, range);
    if (this.itemSet.options.stack) { // TODO: ugly way to access options...
      stack.stack(this.visibleItems, margin, restack);
    }
    else { // no stacking
      stack.nostack(this.visibleItems, margin, this.subgroups);
    }
  }

  // recalculate the height of the group
  var height = this._calculateHeight(margin);

  // calculate actual size and position
  var foreground = this.dom.foreground;
  this.top = foreground.offsetTop;
  this.right = foreground.offsetLeft;
  this.width = foreground.offsetWidth;
  resized = util.updateProperty(this, 'height', height) || resized;
  // recalculate size of label
  resized = util.updateProperty(this.props.leftLabel, 'width', this.dom.leftInner.clientWidth) || resized;
  resized = util.updateProperty(this.props.leftLabel, 'height', this.dom.leftInner.clientHeight) || resized;

  // apply new height
  this.dom.background.style.height  = height + 'px';
  this.dom.foreground.style.height  = height + 'px';
  this.dom.leftLabel.style.height = height + 'px';
  this.dom.rightCenterOneLabel.style.height = height + 'px';
  this.dom.rightCenterTwoLabel.style.height = height + 'px';

  // update vertical position of items after they are re-stacked and the height of the group is calculated
  for (var i = 0, ii = this.visibleItems.length; i < ii; i++) {
    var item = this.visibleItems[i];
    item.repositionY(margin);
  }

  return resized;
};

/**
 * recalculate the height of the subgroups
 * @private
 */
Group.prototype._calculateSubGroupHeights = function () {
  if (Object.keys(this.subgroups).length > 0) {
    var me = this;

    this.resetSubgroups();

    util.forEach(this.visibleItems, function (item) {
      if (item.data.subgroup !== undefined) {
        me.subgroups[item.data.subgroup].height = Math.max(me.subgroups[item.data.subgroup].height, item.height);
        me.subgroups[item.data.subgroup].visible = true;
      }
    });
  }
};

/**
 * recalculate the height of the group
 * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
 * @returns {number} Returns the height
 * @private
 */
Group.prototype._calculateHeight = function (margin) {
  // recalculate the height of the group
  var height;
  var visibleItems = this.visibleItems;
  if (visibleItems.length > 0) {
    var min = visibleItems[0].top;
    var max = visibleItems[0].top + visibleItems[0].height;
    util.forEach(visibleItems, function (item) {
      min = Math.min(min, item.top);
      max = Math.max(max, (item.top + item.height));
    });
    if (min > margin.axis) {
      // there is an empty gap between the lowest item and the axis
      var offset = min - margin.axis;
      max -= offset;
      util.forEach(visibleItems, function (item) {
        item.top -= offset;
      });
    }
    height = max + margin.item.vertical / 2;
  }
  else {
    height = 0;
  }
  height = Math.max(height, this.props.leftLabel.height);

  return height;
};

/**
 * Show this group: attach to the DOM
 */
Group.prototype.show = function() {
  if (!this.dom.leftLabel.parentNode) {
    this.itemSet.dom.leftLabelSet.appendChild(this.dom.leftLabel);
    this.itemSet.dom.rightCenterOneLabelSet.appendChild(this.dom.rightCenterOneLabel);
    this.itemSet.dom.rightCenterTwoLabelSet.appendChild(this.dom.rightCenterTwoLabel);
  }

  if (!this.dom.foreground.parentNode) {
    this.itemSet.dom.foreground.appendChild(this.dom.foreground);
  }

  if (!this.dom.background.parentNode) {
    this.itemSet.dom.background.appendChild(this.dom.background);
  }

  if (!this.dom.axis.parentNode) {
    this.itemSet.dom.axis.appendChild(this.dom.axis);
  }
};

/**
 * Hide this group: remove from the DOM
 */
Group.prototype.hide = function() {
  var leftLabel = this.dom.leftLabel;
  var rightCenterOneLabel = this.dom.rightCenterOneLabel;
  var rightCenterTwoLabel = this.dom.rightCenterTwoLabel;
  if (leftLabel.parentNode) {
    leftLabel.parentNode.removeChild(leftLabel);
    rightCenterOneLabel.parentNode.removeChild(rightCenterOneLabel);
    rightCenterTwoLabel.parentNode.removeChild(rightCenterTwoLabel);
  }

  var foreground = this.dom.foreground;
  if (foreground.parentNode) {
    foreground.parentNode.removeChild(foreground);
  }

  var background = this.dom.background;
  if (background.parentNode) {
    background.parentNode.removeChild(background);
  }

  var axis = this.dom.axis;
  if (axis.parentNode) {
    axis.parentNode.removeChild(axis);
  }
};

/**
 * Add an item to the group
 * @param {Item} item
 */
Group.prototype.add = function(item) {
  this.items[item.id] = item;
  item.setParent(this);

  // add to
  if (item.data.subgroup !== undefined) {
    if (this.subgroups[item.data.subgroup] === undefined) {
      this.subgroups[item.data.subgroup] = {height:0, visible: false, index:this.subgroupIndex, items: []};
      this.subgroupIndex++;
    }
    this.subgroups[item.data.subgroup].items.push(item);
  }
  this.orderSubgroups();

  if (this.visibleItems.indexOf(item) == -1) {
    var range = this.itemSet.body.range; // TODO: not nice accessing the range like this
    this._checkIfVisible(item, this.visibleItems, range);
  }
};

Group.prototype.orderSubgroups = function() {
  if (this.subgroupOrderer !== undefined) {
    var sortArray = [];
    if (typeof this.subgroupOrderer == 'string') {
      for (var subgroup in this.subgroups) {
        sortArray.push({subgroup: subgroup, sortField: this.subgroups[subgroup].items[0].data[this.subgroupOrderer]})
      }
      sortArray.sort(function (a, b) {
        return a.sortField - b.sortField;
      })
    }
    else if (typeof this.subgroupOrderer == 'function') {
      for (var subgroup in this.subgroups) {
        sortArray.push(this.subgroups[subgroup].items[0].data);
      }
      sortArray.sort(this.subgroupOrderer);
    }

    if (sortArray.length > 0) {
      for (var i = 0; i < sortArray.length; i++) {
        this.subgroups[sortArray[i].subgroup].index = i;
      }
    }
  }
};

Group.prototype.resetSubgroups = function() {
  for (var subgroup in this.subgroups) {
    if (this.subgroups.hasOwnProperty(subgroup)) {
      this.subgroups[subgroup].visible = false;
    }
  }
};

/**
 * Remove an item from the group
 * @param {Item} item
 */
Group.prototype.remove = function(item) {
  delete this.items[item.id];
  item.setParent(null);

  // remove from visible items
  var index = this.visibleItems.indexOf(item);
  if (index != -1) this.visibleItems.splice(index, 1);

  if(item.data.subgroup !== undefined){
    var subgroup = this.subgroups[item.data.subgroup];
    if (subgroup){
      var itemIndex = subgroup.items.indexOf(item);
      subgroup.items.splice(itemIndex,1);
      if (!subgroup.items.length){
        delete this.subgroups[item.data.subgroup];
        this.subgroupIndex--;
      }
      this.orderSubgroups();
    }
  }
};


/**
 * Remove an item from the corresponding DataSet
 * @param {Item} item
 */
Group.prototype.removeFromDataSet = function(item) {
  this.itemSet.removeItem(item.id);
};


/**
 * Reorder the items
 */
Group.prototype.order = function() {
  var array = util.toArray(this.items);
  var startArray = [];
  var endArray = [];

  for (var i = 0; i < array.length; i++) {
    if (array[i].data.end !== undefined) {
      endArray.push(array[i]);
    }
    startArray.push(array[i]);
  }
  this.orderedItems = {
    byStart: startArray,
    byEnd: endArray
  };

  stack.orderByStart(this.orderedItems.byStart);
  stack.orderByEnd(this.orderedItems.byEnd);
};


/**
 * Update the visible items
 * @param {{byStart: Item[], byEnd: Item[]}} orderedItems   All items ordered by start date and by end date
 * @param {Item[]} visibleItems                             The previously visible items.
 * @param {{start: number, end: number}} range              Visible range
 * @return {Item[]} visibleItems                            The new visible items.
 * @private
 */
Group.prototype._updateVisibleItems = function(orderedItems, oldVisibleItems, range) {
  var visibleItems = [];
  var visibleItemsLookup = {}; // we keep this to quickly look up if an item already exists in the list without using indexOf on visibleItems
  var interval = (range.end - range.start) / 4;
  var lowerBound = range.start - interval;
  var upperBound = range.end + interval;
  var item, i;

  // this function is used to do the binary search.
  var searchFunction = function (value) {
    if      (value < lowerBound)  {return -1;}
    else if (value <= upperBound) {return  0;}
    else                          {return  1;}
  }

  // first check if the items that were in view previously are still in view.
  // IMPORTANT: this handles the case for the items with startdate before the window and enddate after the window!
  // also cleans up invisible items.
  if (oldVisibleItems.length > 0) {
    for (i = 0; i < oldVisibleItems.length; i++) {
      this._checkIfVisibleWithReference(oldVisibleItems[i], visibleItems, visibleItemsLookup, range);
    }
  }

  // we do a binary search for the items that have only start values.
  var initialPosByStart = util.binarySearchCustom(orderedItems.byStart, searchFunction, 'data','start');

  // trace the visible items from the inital start pos both ways until an invisible item is found, we only look at the start values.
  this._traceVisible(initialPosByStart, orderedItems.byStart, visibleItems, visibleItemsLookup, function (item) {
    return (item.data.start < lowerBound || item.data.start > upperBound);
  });

  // if the window has changed programmatically without overlapping the old window, the ranged items with start < lowerBound and end > upperbound are not shown.
  // We therefore have to brute force check all items in the byEnd list
  if (this.checkRangedItems == true) {
    this.checkRangedItems = false;
    for (i = 0; i < orderedItems.byEnd.length; i++) {
      this._checkIfVisibleWithReference(orderedItems.byEnd[i], visibleItems, visibleItemsLookup, range);
    }
  }
  else {
    // we do a binary search for the items that have defined end times.
    var initialPosByEnd = util.binarySearchCustom(orderedItems.byEnd, searchFunction, 'data','end');

    // trace the visible items from the inital start pos both ways until an invisible item is found, we only look at the end values.
    this._traceVisible(initialPosByEnd, orderedItems.byEnd, visibleItems, visibleItemsLookup, function (item) {
      return (item.data.end < lowerBound || item.data.end > upperBound);
    });
  }


  // finally, we reposition all the visible items.
  for (i = 0; i < visibleItems.length; i++) {
    item = visibleItems[i];
    if (!item.displayed) item.show();
    // reposition item horizontally
    item.repositionX();
  }

  // debug
  //console.log("new line")
  //if (this.groupId == null) {
  //  for (i = 0; i < orderedItems.byStart.length; i++) {
  //    item = orderedItems.byStart[i].data;
  //    console.log('start',i,initialPosByStart, item.start.valueOf(), item.content, item.start >= lowerBound && item.start <= upperBound,i == initialPosByStart ? "<------------------- HEREEEE" : "")
  //  }
  //  for (i = 0; i < orderedItems.byEnd.length; i++) {
  //    item = orderedItems.byEnd[i].data;
  //    console.log('rangeEnd',i,initialPosByEnd, item.end.valueOf(), item.content, item.end >= range.start && item.end <= range.end,i == initialPosByEnd ? "<------------------- HEREEEE" : "")
  //  }
  //}

  return visibleItems;
};

Group.prototype._traceVisible = function (initialPos, items, visibleItems, visibleItemsLookup, breakCondition) {
  var item;
  var i;

  if (initialPos != -1) {
    for (i = initialPos; i >= 0; i--) {
      item = items[i];
      if (breakCondition(item)) {
        break;
      }
      else {
        if (visibleItemsLookup[item.id] === undefined) {
          visibleItemsLookup[item.id] = true;
          visibleItems.push(item);
        }
      }
    }

    for (i = initialPos + 1; i < items.length; i++) {
      item = items[i];
      if (breakCondition(item)) {
        break;
      }
      else {
        if (visibleItemsLookup[item.id] === undefined) {
          visibleItemsLookup[item.id] = true;
          visibleItems.push(item);
        }
      }
    }
  }
}


/**
 * this function is very similar to the _checkIfInvisible() but it does not
 * return booleans, hides the item if it should not be seen and always adds to
 * the visibleItems.
 * this one is for brute forcing and hiding.
 *
 * @param {Item} item
 * @param {Array} visibleItems
 * @param {{start:number, end:number}} range
 * @private
 */
Group.prototype._checkIfVisible = function(item, visibleItems, range) {
    if (item.isVisible(range)) {
      if (!item.displayed) item.show();
      // reposition item horizontally
      item.repositionX();
      visibleItems.push(item);
    }
    else {
      if (item.displayed) item.hide();
    }
};


/**
 * this function is very similar to the _checkIfInvisible() but it does not
 * return booleans, hides the item if it should not be seen and always adds to
 * the visibleItems.
 * this one is for brute forcing and hiding.
 *
 * @param {Item} item
 * @param {Array} visibleItems
 * @param {{start:number, end:number}} range
 * @private
 */
Group.prototype._checkIfVisibleWithReference = function(item, visibleItems, visibleItemsLookup, range) {
  if (item.isVisible(range)) {
    if (visibleItemsLookup[item.id] === undefined) {
      visibleItemsLookup[item.id] = true;
      visibleItems.push(item);
    }
  }
  else {
    if (item.displayed) item.hide();
  }
};



module.exports = Group;
