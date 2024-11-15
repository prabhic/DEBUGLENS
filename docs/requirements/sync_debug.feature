Feature: DebugLens Frontend Tool
    As a developer
    I want to use DebugLens to understand code execution from my prompt
    So that I can better understand program flow and concepts

    Background:
        Given the DebugLens frontend tool is open
        And the prompt input box is visible

    Scenario: Enter Prompt and View Generated Code
        When I enter a prompt in the input box
        And I submit the prompt
        Then the editor should display the generated code
        And the code should be properly formatted and syntax highlighted
        And breakpoints should be visible in the code

    Scenario: Start and Step Through Debug Session
        Given the generated code is displayed in the editor
        When I click the "Start" button
        Then the debugger should initialize
        And execution should pause at the first breakpoint
        And the current line should be highlighted

    Scenario: View Variables and Concepts While Stepping
        Given the code execution is paused at a breakpoint
        Then the variable panel should show:
            | Property | Description                    |
            | Name     | Variable identifier            |
            | Value    | Current value at breakpoint    |
            | Changed  | Indicator if value has changed |
        And the concept panel should show:
            | Element | Description                  |
            | Title   | Concept being demonstrated   |
            | Points  | Key learning points for step |
        When I click the "Next" button
        Then execution should continue to the next breakpoint
        And both panels should update with new information
