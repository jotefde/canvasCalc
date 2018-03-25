let FPS = 30;

let Label = function(_text, _width, _height, _x, _y, _style) {
	this._text = (!_text || 0 === _text.length) ? "Simple text" : _text;
	this._size = {
		width: (Number.isInteger(_width)) ? _width : 0,
		height: (Number.isInteger(_height)) ? _height: 0
	};
	this._position = {
		x: (Number.isInteger(_x)) ? _x : 0,
		y: (Number.isInteger(_y)) ? _y : 0
	};

	if( !_style )
		_style = {
			fill: "#666",
			text: "#fff",
			align: "center",
			font: "15px Arial",
			borderColor: "#000",
			borderWidth: 1
		};

	this.style = {
		fill: (!_style.fill || 0 === _style.fill.length) ? "#666" : _style.fill,
		text: (!_style.text || 0 === _style.text.length) ? "#fff" : _style.text,
		align: (!_style.align || 0 === _style.align.length) ? "center" : _style.align,
		font: (!_style.text || 0 === _style.text.length) ? "15px Arial" : _style.font,
		borderColor: (!_style.borderColor || 0 === _style.borderColor.length) ? "#000" : _style.borderColor,
		borderWidth: (Number.isInteger(_style.borderWidth)) ? _style.borderWidth : 1,
		disabled: (!_style.disabled) ? false : true
	};
	this.events = {
		click: null,
		hover: null
	};

	return {
		Text: this._text,
		Position: this._position,
		Width: this._size.width,
		Height: this._size.height,
		Events: this.events,
		Style: this.style
	}
};

let App = function(_ctx, _width, _height) {

	this.ctx = _ctx;
	this.width = _width;
	this.height = _height;
	this.Objects = {};
	this.InputBuffer = "0";
	this.Action = null;
	this.Results = new Array();
	this.ActionsChain = new Array();

	this.drawObjects = function() {
		for( let i in this.Objects ) {
			let object = this.Objects[i];
			this.ctx.beginPath();
			this.ctx.fillStyle = object.Style.fill;
			this.ctx.strokeStyle = object.Style.borderColor;
			this.ctx.strokeWidth = object.Style.borderWidth;


			this.ctx.fillRect(object.Position.x, object.Position.y, object.Width, object.Height);
			this.ctx.strokeRect(object.Position.x, object.Position.y, object.Width, object.Height);

			this.ctx.fillStyle = object.Style.text;
			this.ctx.textAlign = object.Style.align;
			this.ctx.font = object.Style.font;
			let fontX,
				fontY = object.Position.y + (object.Height/2) + 5;

			if( object.Style.align == "center" ) {
				fontX = object.Position.x + (object.Width/2);
			} else if( object.Style.align == "left" ) {
				fontX = object.Position.x + 5;
			} else {
				fontX = object.Position.x + object.Width-10;
			}

			this.ctx.fillText(object.Text,fontX,fontY);
			this.ctx.closePath();

		}
	};

	this.Loop = function() {
		this.ctx.clearRect(0,0,this.width, this.height);
		//console.log(this.Objects);
		this.Objects["resultLabel"].Text = this.InputBuffer;
		this.drawObjects();

		window.requestAnimationFrame(this.Loop.bind(this));
	};

	this.ClickEvent = function(e) {

		let offset = e.target.getBoundingClientRect();
		let clickX = e.clientX - offset.left;
		let clickY = e.clientY - offset.top;
		for( let i in this.Objects ) {
			let object = this.Objects[i];
			if(object.Style.disabled) continue;

			if( this.pointInField(
				{x: clickX, y: clickY},
				object.Position,
				{width: object.Width, height: object.Height} ) )
			{
				object.Style.fadeFill = object.Style.fill;
				object.Style.fill = "#AAA";
				window.setTimeout(function() { this.Style.fill = this.Style.fadeFill }.bind(object), 100);
				object.Events.click();
			}
		}
	};

	this.pointInField = function(pos1, pos2, field) {
		let x1 = Math.abs(pos1.x);
		let y1 = Math.abs(pos1.y);
		let x2 = Math.abs(pos2.x);
		let y2 = Math.abs(pos2.y);
		if( ( x1 >= x2 && x1 <= x2+field.width) &&
			( y1 >= y2 && y1 <= y2+field.height) )
			return true;
		else
			return false;
	};

	this.Start = function() {
		document.querySelector("#canvas").addEventListener("click", this.ClickEvent.bind(this));
		this.GenerateNumPad();
		this.GenerateActionPad();
		this.Objects["resultLabel"] = new Label("0", this.width, 80, 0, 0, {fill: "#eee", text: "#111", align: "right", font: "28px Arial", disabled: true});
		//console.log(this.Objects);
		window.requestAnimationFrame(this.Loop.bind(this));
	};

	this.GenerateNumPad = function() {

		let buttonSize = 80;
		let posX = 0;
		let posY = this.height - (buttonSize*2);
		let parent = this;
		let num;

		for( num = 1; num <= 9; num++ )
		{
			this.Objects[num] = new Label(num, buttonSize, buttonSize, posX, posY);
			this.Objects[num].Events.click = this.AppendToBuffer.bind({parent, num});
			posX += 80;
			if( num % 3 == 0 ) {
				posY -= 80;
				posX = 0;
			}
		}
		num = 0;
		this.Objects["0"] = new Label("0", buttonSize*2, buttonSize, 0, this.height - buttonSize);
		this.Objects["0"].Events.click = this.AppendToBuffer.bind({parent, num});

		num = ".";
		this.Objects[","] = new Label(",", buttonSize, buttonSize, buttonSize*2, this.height - buttonSize, {fill: "#555"});
		this.Objects[","].Events.click = this.AppendToBuffer.bind({parent, num});
	};

	this.GenerateActionPad = function() {
		let buttonSize = 80;
		let parent = this;
		let action;

		action = "=";
		this.Objects[action] = new Label(action, buttonSize, buttonSize, this.width - buttonSize*2, this.height - buttonSize, {fill: "#5a5"});
		this.Objects[action].Events.click = this.GetResult.bind(this);

		action = "P";
		this.Objects[action] = new Label(action, buttonSize, buttonSize, this.width - buttonSize, this.height - buttonSize, {fill: "#cc0"});
		this.Objects[action].Events.click = this.UndoAction.bind(this);

		action = "+";
		this.Objects[action] = new Label(action, buttonSize, buttonSize, this.width - buttonSize*2, this.height - buttonSize*2, {fill: "#77f"});
		this.Objects[action].Events.click = this.SetAction.bind({parent, action});

		action = "-";
		this.Objects[action] = new Label(action, buttonSize, buttonSize, this.width - buttonSize, this.height - buttonSize*2, {fill: "#77f"});
		this.Objects[action].Events.click = this.SetAction.bind({parent, action});

		action = "*";
		this.Objects[action] = new Label(action, buttonSize, buttonSize, this.width - buttonSize*2, this.height - buttonSize*3, {fill: "#77f"});
		this.Objects[action].Events.click = this.SetAction.bind({parent, action});

		action = "/";
		this.Objects[action] = new Label(action, buttonSize, buttonSize, this.width - buttonSize, this.height - buttonSize*3, {fill: "#77f"});
		this.Objects[action].Events.click = this.SetAction.bind({parent, action});

		action = "CE";
		this.Objects[action] = new Label(action, buttonSize, buttonSize, this.width - buttonSize*2, this.height - buttonSize*4, {fill: "#f55"});
		this.Objects[action].Events.click = this.ClearEnter.bind(this);

		action = "C";
		this.Objects[action] = new Label(action, buttonSize, buttonSize, this.width - buttonSize, this.height - buttonSize*4, {fill: "#f55"});
		this.Objects[action].Events.click = this.Clear.bind(this);
	};

	this.AppendToBuffer = function() {
		if(this.parent.InputBuffer.length >= 15) return false;


		if( Number.isInteger(this.num) ) {
			if( this.parent.InputBuffer.length < 1 || this.parent.InputBuffer == 0 )
				this.parent.InputBuffer = "";
			this.parent.InputBuffer += this.num;
		}
		else if(this.num == ".") {
			if( this.parent.InputBuffer.indexOf(this.num) == -1 )
				this.parent.InputBuffer += this.num;
		}
	};

	this.SetAction = function() {
		if( this.parent.Action != null && this.parent.Results.length > 0 && this.parent.ActionsChain.length > 0 && this.parent.InputBuffer != "0" )
			this.parent.GetResult();

		this.parent.Results.push(parseFloat(this.parent.InputBuffer));
		this.parent.ActionsChain.push(this.action);
		this.parent.Action = this.action;
		this.parent.ClearEnter();
	};

	this.ClearEnter = function() {
		this.InputBuffer = "0";
	};

	this.Clear = function() {
		this.InputBuffer = "0";
		this.Action = null;
		this.ActionsChain = new Array();
		this.Results = new Array();
	};

	this.doAction = function(num1, num2, act)
	{
		let result = 0;
		switch(act)
		{
			case "+":
				result = num1+num2;
				break;
			case "-":
				result = num1-num2;
				break;
			case "*":
				result = num1*num2;
				break;
			case "/":
				if(num2 == 0)
				{
					alert("You can't divide by zero!");
					return false;
				}
				result = num1/num2;
				break;
		}
		return result;
	};

	this.GetResult = function()
	{
		if( this.Action.length !== 1  )
			return false;

		if( this.Results.length < 1)
			return false;
		let num1 = this.Results[this.Results.length-1];
		let num2 = parseFloat(this.InputBuffer);
		let result = this.doAction(num1, num2, this.Action);
		if( result !== false)
		{
			this.InputBuffer = result;
			this.Action = null;
		}

	};

	this.UndoAction = function()
	{
		if(this.ActionsChain.length < 1 || this.Results.length < 1)
			return false;

		this.InputBuffer = this.Results.pop();
		this.Action = this.ActionsChain.pop();
	};

	/*return {
		Loop: this._loop,
		Objects: this.objects
	};*/
};
