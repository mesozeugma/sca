package code_samples;

import java.util.ArrayList;
import java.util.Random;

public class HelloWorld extends Thread implements Runnable {
    public static void main(String[] args) {
        run();
    }

    public void run() {
        // a comment line
        System.out.println("Hello World");
    }
}
