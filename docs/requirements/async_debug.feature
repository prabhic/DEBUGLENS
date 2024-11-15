
    Scenario: Initial Load and Parallel Processing
        Given I enable parallel loading mode
        When I enter a prompt in the input box
        And I submit the prompt
        Then all debug steps should be loaded
        And the loaded debug steps should be shown
        And code for first step should load in background
        And variable data for first step should load in background
        And concept for first step should load in background

    Scenario: display of loaded code
        Given parallel loading mode is enabled
        And debug steps and displayed
        When code for first step loads
        Then the code should be displayed
        And breakpoints should be visible

    Scenario: Data Display on Debug Start
        Given parallel loading mode is enabled
        And code is displayed with breakpoints
        When I start the debugging session
        And execution pauses at first breakpoint
        Then variable panel should display loaded data
        And concept panel should display loaded data
        And the UI should remain responsive

    Scenario: Background Data Loading Performance
        Given parallel loading mode is enabled
        When I submit multiple prompts in succession
        Then all code steps should load and display immediately
        And variable data should load in background without UI blocking
        And concept data should load in background without UI blocking
        And the UI should remain responsive throughout loading

