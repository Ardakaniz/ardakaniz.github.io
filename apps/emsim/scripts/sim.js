class Charge {
	constructor(val, pos) {
		this.val = val;
		this.pos = pos;
	}

	copy() {
		return new Charge(this.val, this.pos.copy());
	}

	get_radius() {
		if (this.val == 0) {
			return 10;
		}
		else {
			return abs(10 * this.val);
		}
	}

	draw() {
		push();
		if (this.val > 0) { // Positive charge = red
			fill(255, 0, 0);
		}
		else if (this.val < 0) { // Negative charge = blue
			fill(0, 0, 255);
		}
		else { // Neutral charge = white
			fill(255, 255, 255);
		}
		circle(this.pos.x, this.pos.y, this.get_radius());
		pop();
	}
}

class Field {
	constructor(charges) {
		this.charges = charges;
	}

	/* Return Field vector at position pos */
	value(pos) {
		var sum = new p5.Vector();
		
		for (var i = 0; i < this.charges.length; i++) {
			var charge_effect = pos.copy();
			charge_effect.sub(this.charges[i].pos);

			if (charge_effect.magSq() > 1e-5) {
				charge_effect.mult(this.charges[i].val / (charge_effect.mag() * charge_effect.magSq()));
			}
			
			sum.add(charge_effect);
		}

		return sum;
	}
}

class ArrowField {
	constructor(x_count, y_count, val_gen) {
		this.count = createVector(x_count, y_count);
		this.val_gen = val_gen;
	}

	draw() {
		for (var y = 1; y < this.count.y + 1; ++y) {
			for (var x = 1; x < this.count.x + 1; ++x) {
				var pos = createVector(width / (this.count.x + 1) * x, height / (this.count.y + 1) * y);
				var val = this.val_gen(pos);
				var intensity = 255;

				if (val.magSq() != 0) {
					this.drawArrow(pos, val.mult(1 / val.mag()).mult(20), 255);
				}
			}
		}
	}

	drawArrow(pos, vec, intensity) { // code from p5.js doc
		push();
		stroke(intensity);
		strokeWeight(3);
		fill(intensity);
		translate(pos.x - vec.x / 2, pos.y - vec.y / 2); // Center the arrow around the position
		line(0, 0, vec.x, vec.y);
		rotate(vec.heading());
		let arrowSize = 7;
		translate(vec.mag() - arrowSize, 0);
		triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
		pop();
	}
}

field = new Field([]);
arrows = undefined;
mouse_charge = undefined;

function setup() {
	createCanvas(800, 800);
	field.charges.push(new Charge(+1, createVector(mouseX, mouseY))); // Mouse charge
	field.charges.push(new Charge(+1, createVector(400, 400)));
	field.charges.push(new Charge(-1, createVector(600, 400)));
	field.charges.push(new Charge(-1, createVector(200, 400)));

	mouse_charge = field.charges[0];
	arrows = new ArrowField(15, 15, function(pos){return field.value(pos);});
}

function draw() {	
	background(0); // bl4ck

	push()
	textSize(15)
	fill(255)
	text("Mouse Wheel: select charge value", 0, 15);
	text("Click: add/remove charge", 0, 30);
	pop()

	mouse_charge.pos.x = mouseX;
	mouse_charge.pos.y = mouseY;
	mouse_charge.draw();
	
	arrows.draw();

	for (var i = 0; i < field.charges.length; ++i) {
		field.charges[i].draw();
	}
}

function mouseClicked() {
	for (var i = 1; i < field.charges.length; ++i) {
		const charge = field.charges[i];

		if (mouseX >= charge.pos.x - charge.get_radius() && mouseX <= charge.pos.x + charge.get_radius()
			&& mouseY >= charge.pos.y - charge.get_radius() && mouseY <= charge.pos.y + charge.get_radius())
		{
			field.charges.splice(i, 1);
			return; // We don't add the new charge if we deleted one
		}
	}

	field.charges.push(mouse_charge.copy());
	//mouse_charge = field.charges[0];
}

function mouseWheel(event) {
	if (event.delta > 0) {
		mouse_charge.val -= 1;
	}
	else {
		mouse_charge.val += 1;
	}
}