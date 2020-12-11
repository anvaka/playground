// trying to play music with arduino's buzzer
float C = 130.81;
float D = 146.83;
float E = 164.81;
float F = 174.61;
float G = 392;
float A = 440;
float B = 493.88;

int notePause = 300;
int quarter = 60;

void setup() {
  pinMode(10, OUTPUT);
  pinMode(A2, INPUT);
}

void loop() {
  int l = 0; 
  playNote(C, quarter, notePause);
  playNote(C, quarter, notePause);
  
  playNote(D, quarter, notePause);
  playNote(D, quarter, notePause);

  playNote(E, quarter, notePause);
  playNote(E, quarter, notePause);

  playNote(F, quarter * 2, 2 * notePause);
  
  playNote(E, quarter, notePause);
  playNote(E, quarter, notePause);

  playNote(D, quarter, notePause);
  playNote(D, quarter, notePause);
 
  playNote(C, quarter, notePause);
  playNote(C, quarter, notePause);
  playNote(C, quarter, notePause);


  delay(1000);
}

void playNote(float note, int ms, int pause) {
  int counter = 0;
  float duration =  1000. / note;
  float maxBeeps = ms * 500. /  duration;
  // note - time on in microseconds
  while (counter < maxBeeps) {
    digitalWrite(10, HIGH);
    delayMicroseconds(duration);
    digitalWrite(10, LOW);
    delayMicroseconds(duration);
    counter += 1;
  }
  delay(pause);
}
