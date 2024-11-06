Feature: DebugLens Frontend Tool
    As a developer
    I want to use DebugLens to debug and understand code execution
    So that I can better understand program flow and state changes

    Background:
        Given the DebugLens frontend tool is open
        And debug info JSON data is loaded

    Scenario: View Available Scenarios
        When the debug info JSON is parsed
        Then the scenario panel should display all available scenarios
        And each scenario should show its name and description
        And scenarios should be grouped by their categories

    Scenario: Select and View Scenario Code
        Given the scenarios are displayed in the scenario panel
        When I select a specific scenario
        Then the editor panel should display the associated code
        And the code should be properly formatted and syntax highlighted

    Scenario: Start Debugging Session
        Given a scenario is selected in the editor
        And at least one breakpoint is visible
        When I click the "Start Debugging" button
        Then the debugger should initialize
        And execution should pause at the first breakpoint
        And the current line should be highlighted

    Scenario: View Variables at Breakpoint
        Given the code execution is paused at a breakpoint
        Then the variable panel should be displayed
        And it should show all variables defined for that breakpoint
        And for each variable it should display:
            | Property | Description                    |
            | Name     | Variable identifier            |
            | Previous | Previous value if changed      |
            | Current  | Current value at breakpoint    |
            | Type     | Data type of the variable      |
            | Changed  | Indicator if value has changed |

    Scenario: View Concepts at Breakpoint
        Given the code execution is paused at a breakpoint
        Then the concept panel should be updated
        And it should display:
            | Element | Description                       |
            | Title   | Main concept being demonstrated   |
            | Points  | Key learning points for this step |
            | Focus   | Current learning focus            |

    Scenario: Navigate Between Breakpoints
        Given the code execution is paused at a breakpoint
        When I press the "Next" button
        Then execution should continue to the next breakpoint
        And all panels should update with new breakpoint information
        And the current line indicator should move to the new position
