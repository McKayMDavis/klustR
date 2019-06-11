#' Parallel Coordinates Plot for Clustering
#'
#' Creates an interactive parallel coordinates plot detailing each
#' dimension and the cluster associated with each observation.
#'
#' @param data A dataframe of numeric columns.
#'
#' @param clusters A named integer matrix of clusters where names are the row names
#' of the above dataframe and integers are the integer value of the row's associated cluster.
#' This can be obtained from a function such as \code{ stats::kmeans()$cluster }.
#'
#' @param colorScheme The color scheme of the plot. May be a preconfigured D3 ordinal color scheme
#' or a vector of html colors (hex or named) of the same length as the number of clusters.
#'
#' @param width The width of the plot window.
#'
#' @param height The height of the plot window.
#'
#' @param labelSizes A number or list of any combination of parameters shown that define the label sizes.
#' \code{ list(yaxis = 12, yticks = 10, tooltip = 15) }.
#'
#' @param measures A list of functions that is any combination of parameters shown that define the measurements for intervals and average lines displayed.
#' Defaults to the options shown (median and 1st and 3rd quartile). \cr
#' \code{ list(avg = median, upper = function(x){return(quantile(x, c(0.75)))}, lower = function(x){return(quantile(x, c(0.25)))}) }
#'
#' @details
#' \itemize{
#'   \item Hover over lines to display row label
#'   \item Click on a line to fade out all lines except the associated cluster
#'   \item Click on another line to bold this line as well
#'   \item Clicking a second time on a line will fade it out
#' }
#'
#' @examples
#' \dontrun{
#'
#' # Barebones
#' df <- state.x77
#' clus <- kmeans(data_scaled, 5)$cluster
#' pacoplot(data = df, clusters = clus)
#'
#' # With options
#' df <- state.x77
#' clus <- kmeans(data_scaled, 5)$cluster
#' pacoplot(data = df, clusters = clus,
#'          colorScheme = c("red", "green", "orange", "blue", "yellow"),
#'          labelSizes = list(yaxis = 16, yticks = 12),
#'          measures = list(avg = mean))
#'
#' }
#'
#' @import htmlwidgets
#'
#' @export
pacoplot <- function(data,
                     clusters,
                     colorScheme = "schemeCategory10",
                     width = NULL,
                     height = NULL,
                     labelSizes = NULL,
                     measures = NULL) {
  # Parameter checks
  if (typeof(colorScheme) != "character" && typeof(colorScheme) != "list") {
    stop("colorScheme must be of type character or a list of colors")
  }
  if (!is.null(labelSizes) &&
      typeof(labelSizes) != "list" &&
      typeof(labelSizes) != "double") {
    stop("labelSizes must be of type double or a list of arguments")
  }

  # Data parsing
  if (!is.null(measures$avg)) {
    avgFun <- measures$avg
  } else {
    avgFun <- median
  }

  if (!is.null(measures$lower)) {
    lowFun <- measures$lower
  } else {
    lowFun <- function(x){return(quantile(x, c(0.25)))}
  }

  if (!is.null(measures$upper)) {
    upFun <- measures$upper
  } else {
    upFun <- function(x){return(quantile(x, c(0.75)))}
  }


  data <- data.frame(data, clusters)

  av_data <- aggregate(. ~ clusters, data, avgFun)

  q1_data <- aggregate(. ~ clusters, data, lowFun)
  q1_data <- reshape(q1_data,
                     varying = list(2:ncol(q1_data)),
                     v.names = "quartile",
                     timevar = "dimensions",
                     times = colnames(q1_data)[2:ncol(q1_data)],
                     direction = "long")[,-4]

  q3_data <- aggregate(. ~ clusters, data, upFun)
  q3_data <- reshape(q3_data,
                     varying = list(2:ncol(q3_data)),
                     v.names = "quartile",
                     timevar = "dimensions",
                     times = colnames(q3_data)[2:ncol(q3_data)],
                     direction = "long")[,-4]

  q_data <- rbind(q1_data, q3_data) # This is the data to make the dots

  colnames(q1_data)[3] <- "q1"
  colnames(q3_data)[3] <- "q3"

  qs_data <- cbind(q1_data, q3_data)[,-c(4:5)] # This is the data to make the bars


  if (typeof(labelSizes) == "double") {
    labelSizes <- list(yaxis = labelSizes,
                       yticks = labelSizes,
                       tooltip = labelSizes)
  }

  # This little guy just orders the clusters so that the legend in the graphic is ordered
  data <- data[order(clusters),]

  # Convert to json
  data_json <- jsonlite::toJSON(x = data, dataframe = "rows")
  json_av_data <- jsonlite::toJSON(x = av_data, dataframe = "rows")
  json_q_data <- jsonlite::toJSON(x = q_data, dataframe = "rows")
  json_qs_data <- jsonlite::toJSON(x = qs_data, dataframe = "rows")
  json_colorScheme <- jsonlite::toJSON(x = colorScheme)
  json_labelSizes <- jsonlite::toJSON(labelSizes)

  # forward options using x
  x = list(
    data = data_json,
    avData = json_av_data,
    qData = json_q_data,
    qsData = json_qs_data,
    colorScheme = json_colorScheme,
    labelSizes = json_labelSizes
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'pacoplot',
    x,
    width = width,
    height = height,
    package = 'klustR',
    sizingPolicy = htmlwidgets::sizingPolicy(
      viewer.padding = 0,
      browser.fill = TRUE
    )
  )
}

#' @rdname klustR-shiny
#' @export
pacoplotOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'pacoplot', width, height, package = 'klustR')
}

#' @rdname klustR-shiny
#' @export
renderpacoplot <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, pacoplotOutput, env, quoted = TRUE)
}
