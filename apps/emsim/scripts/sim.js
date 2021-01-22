class Charge {
	constructor(val, pos) {
		this.val = val;
		this.pos = pos;
		this.max_radius = 20;
	}

	copy() {
		return new Charge(this.val, this.pos.copy());
	}

	get_color() {
		if (this.val > 0) { // Positive charge = red
			return createVector(150 + 30 * this.val, 0, 0);
		}
		else if (this.val < 0) { // Negative charge = blue
			return createVector(0, 0, 150 + 30 * abs(this.val));
		}
		else { // Neutral charge = white
			return createVector(255, 255, 255);
		}
	}

	get_radius() {
		if (this.val == 0) {
			return 10;
		}
		else {
			const raw_radius = 10 + 2 * abs(this.val);
			
			if (raw_radius > this.max_radius) { // radius limit
				return this.max_radius;
			}
			return raw_radius;
		}
	}

	draw() {
		const radius = this.get_radius();

		push();
		fill(this.get_color().x, this.get_color().y, this.get_color().z);
		circle(this.pos.x, this.pos.y, radius);

		if (radius >= this.max_radius) {
			const text_size = this.max_radius / 2;
			const char_size = text_size / 4;

			var val_str = str(this.val);
			var x_offset = val_str.length;
			if (this.val > 0) {
				val_str = "+" + val_str;
				x_offset += 2; // Because the "+" seems to be quite big, 1 is not sufficient
			}

			const text_pos = this.pos.copy().add(-x_offset * char_size, +char_size);

			textSize(text_size);
			fill(255);
			text(val_str, text_pos.x, text_pos.y);
		}
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

			if (charge_effect.magSq() != 0) {
				charge_effect.mult(this.charges[i].val / (charge_effect.mag() * charge_effect.magSq())); // E(M) = q * k / OM^3 (here k = 1 instead of 1/4*pi*epsilon_0)
				sum.add(charge_effect);
			}
		}

		return sum;
	}

	potential(pos) {
		var sum = 0;
		
		for (var i = 0; i < this.charges.length; i++) {
			const dist = pos.dist(this.charges[i].pos);

			if (dist != 0) {
				sum += this.charges[i].val / dist; // V(M) = q * k / OM (k = 1 instead of 1/4*pi*epsilon_0)
			}
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
				const pos = createVector(width / (this.count.x + 1) * x, height / (this.count.y + 1) * y);
				var val = this.val_gen(pos);
				const mag = val.mag();

				if (mag != 0) {
					const intensity = 255 * (mag ** (2/3) * 1000); // No mathematical reason, it looks good
					this.drawArrow(pos, val.mult(1 / mag).mult(20), intensity);
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

const arrows_count = 25;

function setup() {
	createCanvas(1000, 1000);
	field.charges.push(new Charge(0, createVector(mouseX, mouseY))); // Mouse charge
	field.charges.push(new Charge(+1, createVector(width / 2, height / 2)));
	field.charges.push(new Charge(-1, createVector(width / 2 + (width / (arrows_count + 1)) * 5, height / 2)));
	field.charges.push(new Charge(-1, createVector(width / 2 - (width / (arrows_count + 1)) * 5, height / 2)));

	mouse_charge = field.charges[0];
	arrows = new ArrowField(arrows_count, arrows_count, function(pos){return field.value(pos);});
}

function draw() {	
	background(0); // bl4ck

	if (keyIsPressed == true && keyCode == SHIFT) {
		mouse_charge.pos.x = round(map(mouseX, 0, width, 0, arrows_count + 1)) * (width / (arrows_count + 1));
		mouse_charge.pos.y = round(map(mouseY, 0, height, 0, arrows_count + 1)) * (height / (arrows_count + 1));
	}
	else {
		mouse_charge.pos.x = mouseX;
		mouse_charge.pos.y = mouseY;
	}
	mouse_charge.draw();
	
	arrows.draw();

	for (var i = 0; i < field.charges.length; ++i) {
		field.charges[i].draw();
	}

	draw_text();
}

function draw_text() {
	const shadow_text = (mouseX <= 240 && mouseY <= 60)

	push();
	textSize(15);
	if (shadow_text) { fill(255, 255, 255, 50); }
	else             { fill(255); }
	text("Click: add/remove charge", 0, 15);
	text("Mouse Wheel: select charge value", 0, 30);
	text("Shift: Snap cursor on grid", 0, 45);
	pop()
}

function mouseClicked() {
	for (var i = 1; i < field.charges.length; ++i) {
		const charge = field.charges[i];

		if (mouseX >= charge.pos.x - charge.get_radius() / 2 && mouseX <= charge.pos.x + charge.get_radius() / 2
			&& mouseY >= charge.pos.y - charge.get_radius() / 2 && mouseY <= charge.pos.y + charge.get_radius() / 2)
		{
			field.charges.splice(i, 1);
			return; // We don't add the new charge if we deleted one
		}
	}

	field.charges.push(mouse_charge.copy());
}

function mouseWheel(event) {
	if (event.delta > 0) {
		mouse_charge.val -= 1;
	}
	else {
		mouse_charge.val += 1;
	}
}